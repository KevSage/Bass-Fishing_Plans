# app/services/verification_codes.py
"""
Simple in-memory verification code storage with expiry.
For production scale, consider using Redis.
"""
import random
import string
import time
from threading import Lock
from typing import Optional


class VerificationCodeStore:
    """
    Stores verification codes with automatic expiry.
    Thread-safe for concurrent access.
    """

    def __init__(self, expiry_seconds: int = 600):  # 10 minutes default
        self._codes: dict[str, tuple[str, float]] = {}  # email -> (code, expires_at)
        self._lock = Lock()
        self._expiry_seconds = expiry_seconds

    def generate_code(self, email: str) -> str:
        """
        Generate and store a 6-digit verification code for an email.
        Overwrites any existing code for that email.
        """
        code = "".join(random.choices(string.digits, k=6))
        expires_at = time.time() + self._expiry_seconds

        with self._lock:
            self._codes[email.lower()] = (code, expires_at)
            self._cleanup_expired()

        return code

    def verify_code(self, email: str, code: str) -> bool:
        """
        Verify a code for an email. Returns True if valid.
        Code is consumed (deleted) on successful verification.
        """
        email_lower = email.lower()

        with self._lock:
            self._cleanup_expired()

            if email_lower not in self._codes:
                return False

            stored_code, expires_at = self._codes[email_lower]

            if time.time() > expires_at:
                del self._codes[email_lower]
                return False

            if stored_code != code:
                return False

            # Success - consume the code
            del self._codes[email_lower]
            return True

    def _cleanup_expired(self) -> None:
        """Remove expired codes. Called internally with lock held."""
        now = time.time()
        expired = [
            email for email, (_, expires_at) in self._codes.items()
            if now > expires_at
        ]
        for email in expired:
            del self._codes[email]


# Global instance
verification_store = VerificationCodeStore()
