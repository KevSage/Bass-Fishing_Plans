# apps/api/app/services/notifications.py
"""
Push notification service for Bass Clarity.
Handles APNs integration and notification dispatch.
"""
from __future__ import annotations

import os
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import httpx
import jwt
import psycopg
from psycopg.rows import dict_row


# APNs Configuration
APNS_KEY_ID = os.getenv("APNS_KEY_ID")
APNS_TEAM_ID = os.getenv("APNS_TEAM_ID")
APNS_KEY_PATH = os.getenv("APNS_KEY_PATH")  # Path to .p8 file
APNS_KEY_CONTENT = os.getenv("APNS_KEY_CONTENT")  # Or inline key content
APNS_BUNDLE_ID = os.getenv("APNS_BUNDLE_ID", "com.bassclarity.app")
APNS_USE_SANDBOX = os.getenv("APNS_USE_SANDBOX", "false").lower() == "true"

# APNs endpoints
APNS_PRODUCTION_HOST = "https://api.push.apple.com"
APNS_SANDBOX_HOST = "https://api.sandbox.push.apple.com"


class NotificationStore:
    """
    Stores notification logs for debouncing and audit.
    """

    def __init__(self) -> None:
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))

        if self._use_pg:
            self._init_pg()
        else:
            self._init_sqlite()

    def _pg_conn(self):
        return psycopg.connect(self._pg_url, row_factory=dict_row)

    def _init_pg(self) -> None:
        with self._pg_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS notification_logs (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    notification_type TEXT NOT NULL,
                    notification_key TEXT,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    message_preview TEXT
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_notification_logs_email_type
                ON notification_logs(email, notification_type);
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_notification_logs_key
                ON notification_logs(notification_key);
                """
            )
            conn.commit()

    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "notification_logs.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS notification_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    notification_type TEXT NOT NULL,
                    notification_key TEXT,
                    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    message_preview TEXT
                );
                """
            )
            conn.commit()

    def log_notification(
        self,
        email: str,
        notification_type: str,
        notification_key: str,
        message_preview: str = "",
    ) -> None:
        """Log a sent notification."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO notification_logs (email, notification_type, notification_key, message_preview)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (email_norm, notification_type, notification_key, message_preview),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO notification_logs (email, notification_type, notification_key, message_preview)
                    VALUES (?, ?, ?, ?)
                    """,
                    (email_norm, notification_type, notification_key, message_preview),
                )
                conn.commit()

    def was_recently_sent(
        self,
        email: str,
        notification_type: str,
        notification_key: str,
        hours: int = 24,
    ) -> bool:
        """
        Check if a notification was sent to this user recently.
        Used for debouncing.
        """
        email_norm = email.lower().strip()
        cutoff = datetime.now() - timedelta(hours=hours)

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    """
                    SELECT COUNT(*) as count FROM notification_logs
                    WHERE email = %s
                    AND notification_type = %s
                    AND notification_key = %s
                    AND sent_at > %s
                    """,
                    (email_norm, notification_type, notification_key, cutoff),
                ).fetchone()
        else:
            cutoff_str = cutoff.isoformat()
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    """
                    SELECT COUNT(*) as count FROM notification_logs
                    WHERE email = ?
                    AND notification_type = ?
                    AND notification_key = ?
                    AND sent_at > ?
                    """,
                    (email_norm, notification_type, notification_key, cutoff_str),
                ).fetchone()

        return row["count"] > 0 if row else False

    def get_notifications_today(self, email: str, notification_type: str) -> int:
        """Count notifications sent to user today of a given type."""
        email_norm = email.lower().strip()
        today = datetime.now().strftime("%Y-%m-%d")

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    """
                    SELECT COUNT(*) as count FROM notification_logs
                    WHERE email = %s
                    AND notification_type = %s
                    AND DATE(sent_at) = %s
                    """,
                    (email_norm, notification_type, today),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    """
                    SELECT COUNT(*) as count FROM notification_logs
                    WHERE email = ?
                    AND notification_type = ?
                    AND DATE(sent_at) = ?
                    """,
                    (email_norm, notification_type, today),
                ).fetchone()

        return row["count"] if row else 0


class NotificationService:
    """
    Handles sending push notifications via APNs.
    """

    def __init__(self) -> None:
        self._token_cache: Optional[Dict] = None
        self._notification_store = NotificationStore()

    def _get_apns_key(self) -> Optional[str]:
        """Get APNs private key from file or environment."""
        if APNS_KEY_CONTENT:
            return APNS_KEY_CONTENT

        if APNS_KEY_PATH and os.path.exists(APNS_KEY_PATH):
            with open(APNS_KEY_PATH, "r") as f:
                return f.read()

        return None

    def _get_apns_token(self) -> Optional[str]:
        """
        Generate APNs JWT token.
        Tokens are cached for 50 minutes (they expire after 60).
        """
        if not all([APNS_KEY_ID, APNS_TEAM_ID]):
            print("[NotificationService] Missing APNS_KEY_ID or APNS_TEAM_ID")
            return None

        key = self._get_apns_key()
        if not key:
            print("[NotificationService] Missing APNs key")
            return None

        # Check cache
        now = time.time()
        if self._token_cache and self._token_cache.get("expires_at", 0) > now:
            return self._token_cache["token"]

        # Generate new token
        try:
            token = jwt.encode(
                {"iss": APNS_TEAM_ID, "iat": int(now)},
                key,
                algorithm="ES256",
                headers={"kid": APNS_KEY_ID},
            )
            self._token_cache = {
                "token": token,
                "expires_at": now + 3000,  # 50 minutes
            }
            return token
        except Exception as e:
            print(f"[NotificationService] Failed to generate APNs token: {e}")
            return None

    async def send_push_notification(
        self,
        device_token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        badge: Optional[int] = None,
    ) -> bool:
        """
        Send a push notification to a single device.
        Returns True on success, False on failure.
        """
        apns_token = self._get_apns_token()
        if not apns_token:
            print("[NotificationService] No APNs token available")
            return False

        host = APNS_SANDBOX_HOST if APNS_USE_SANDBOX else APNS_PRODUCTION_HOST
        url = f"{host}/3/device/{device_token}"

        # Build payload
        payload = {
            "aps": {
                "alert": {"title": title, "body": body},
                "sound": "default",
            }
        }

        if badge is not None:
            payload["aps"]["badge"] = badge

        if data:
            payload["data"] = data

        headers = {
            "authorization": f"bearer {apns_token}",
            "apns-topic": APNS_BUNDLE_ID,
            "apns-push-type": "alert",
            "apns-priority": "10",
        }

        try:
            async with httpx.AsyncClient(http2=True) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    return True

                # Handle errors
                error_data = response.json() if response.content else {}
                reason = error_data.get("reason", "Unknown")
                print(f"[NotificationService] APNs error: {response.status_code} - {reason}")

                # Mark token as invalid if APNs says so
                if reason in ["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"]:
                    from app.services.device_tokens import DeviceTokenStore
                    DeviceTokenStore().mark_invalid(device_token)

                return False

        except Exception as e:
            print(f"[NotificationService] Failed to send notification: {e}")
            return False

    async def send_to_user(
        self,
        email: str,
        title: str,
        body: str,
        notification_type: str,
        notification_key: str,
        data: Optional[Dict] = None,
    ) -> int:
        """
        Send notification to all devices for a user.
        Respects debouncing rules.
        Returns count of successful sends.
        """
        # Check debounce
        if not self.can_send_notification(email, notification_type, notification_key):
            print(f"[NotificationService] Notification debounced for {email}: {notification_key}")
            return 0

        # Get user's device tokens
        from app.services.device_tokens import DeviceTokenStore
        tokens = DeviceTokenStore().get_tokens_by_email(email)

        if not tokens:
            print(f"[NotificationService] No device tokens for {email}")
            return 0

        # Send to all devices
        success_count = 0
        for token in tokens:
            if await self.send_push_notification(token, title, body, data):
                success_count += 1

        # Log the notification
        if success_count > 0:
            self._notification_store.log_notification(
                email=email,
                notification_type=notification_type,
                notification_key=notification_key,
                message_preview=f"{title}: {body[:50]}",
            )

        return success_count

    def can_send_notification(
        self,
        email: str,
        notification_type: str,
        notification_key: str,
    ) -> bool:
        """
        Check if we can send this notification based on debounce rules.

        Rules:
        - weather_alert: max 1 per day per region (notification_key = date)
        - achievement_proximity: max 1 per day (any achievement)
        """
        # Check if this exact notification was sent in last 24 hours
        if self._notification_store.was_recently_sent(
            email, notification_type, notification_key, hours=24
        ):
            return False

        # Additional type-specific limits
        if notification_type == "achievement_proximity":
            # Max 1 achievement notification per day total
            if self._notification_store.get_notifications_today(email, notification_type) >= 1:
                return False

        if notification_type == "weather_alert":
            # Max 2 weather alerts per week
            # Simple check: max 1 per day
            if self._notification_store.get_notifications_today(email, notification_type) >= 1:
                return False

        return True
