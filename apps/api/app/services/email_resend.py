# app/services/email_resend.py
import os
import requests

RESEND_API_KEY = os.environ["RESEND_API_KEY"]
FROM_EMAIL = os.environ.get("EMAIL_FROM", "plans@angleriq.io")

def send_magic_link(to_email: str, link_url: str) -> None:
    r = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Your Bass Fishing Plans access link",
            "html": f"""
              <p>Here’s your secure link:</p>
              <p><a href="{link_url}">{link_url}</a></p>
              <p>This link expires in 24 hours.</p>
            """,
        },
        timeout=10,
    )
    r.raise_for_status()