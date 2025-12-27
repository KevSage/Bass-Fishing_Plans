# apps/api/app/services/email_service.py
"""
Email service using Resend API.
Handles preview delivery, welcome emails, and audience management.
"""
import os
import requests
from typing import Optional


RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("EMAIL_FROM", "plans@bassclarity.com")
WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassclarity.com")


def send_preview_plan_email(
    to_email: str,
    plan_url: str,
    location_name: str,
    date: str,
) -> None:
    """
    Send preview plan email with marketing message.
    
    Args:
        to_email: Recipient email
        plan_url: Full URL to view plan (/plan/view/{token})
        location_name: Lake name (e.g., "Lake Guntersville")
        date: Plan date (e.g., "December 20, 2025")
    """
    if not RESEND_API_KEY:
        print("WARNING: RESEND_API_KEY not set, skipping email")
        return
    
    subject = f"Your Bass Fishing Plan for {location_name}"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5f2d;">Your Fishing Plan is Ready! 🎣</h2>
    
    <p>Here's your bass fishing plan for <strong>{location_name}</strong> on {date}.</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <a href="{plan_url}" style="display: inline-block; background: #2c5f2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Plan</a>
    </div>
    
    <p><strong>Download Options:</strong></p>
    <ul>
        <li>Mobile Version (Dark Theme) - Optimized for on-the-water viewing</li>
        <li>Printable Version (A4) - Perfect for keeping in your tackle box</li>
    </ul>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <h3 style="color: #2c5f2d;">Want Unlimited Plans?</h3>
    
    <p>This preview gives you Pattern 1 to get started. <strong>Members get:</strong></p>
    
    <ul>
        <li>✅ <strong>Pattern 2</strong> - The pivot plan when fish aren't where expected</li>
        <li>✅ <strong>Full gear recommendations</strong> - Rod, reel, line specs for both patterns</li>
        <li>✅ <strong>Unlimited plan requests</strong> - Generate fresh plans anytime you fish</li>
        <li>✅ <strong>No cooldown periods</strong> - New conditions? Get a new plan instantly</li>
    </ul>
    
    <div style="background: #2c5f2d; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h4 style="margin-top: 0; color: white;">Get Unlimited Access</h4>
        <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">$9.99/month</p>
        <a href="{WEB_BASE_URL}/subscribe?email={to_email}" style="display: inline-block; background: white; color: #2c5f2d; padding: 12px 32px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Subscribe Now</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Tight lines!<br>
        The Bass Clarity Team
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999;">
        You received this email because you requested a fishing plan at BassClarity.com.
    </p>
</body>
</html>
    """
    
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        r.raise_for_status()
        print(f"Preview email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send preview email to {to_email}: {e}")
        # Don't raise - email failure shouldn't block plan generation


def send_welcome_email(to_email: str) -> None:
    """
    Send welcome email to new subscriber.
    
    Args:
        to_email: New subscriber's email
    """
    if not RESEND_API_KEY:
        print("WARNING: RESEND_API_KEY not set, skipping welcome email")
        return
    
    subject = "Welcome to Bass Clarity! 🎣"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5f2d;">Welcome to Bass Clarity! 🎣</h2>
    
    <p>Thanks for subscribing! You now have unlimited access to professional bass fishing plans.</p>
    
    <h3 style="color: #2c5f2d;">What You Get:</h3>
    
    <ul>
        <li><strong>Pattern 1 & Pattern 2</strong> - Primary plan + pivot strategy when conditions change</li>
        <li><strong>Full Gear Recommendations</strong> - Detailed rod, reel, line specs for every technique</li>
        <li><strong>Unlimited Plans</strong> - Generate fresh plans anytime, anywhere you fish</li>
        <li><strong>AI-Powered Insights</strong> - Plans generated from real-time weather and regional bass behavior</li>
    </ul>
    
    <h3 style="color: #2c5f2d;">How to Generate Your First Plan:</h3>
    
    <ol>
        <li>Go to <a href="{WEB_BASE_URL}">BassClarity.com</a></li>
        <li>Enter your email (this one: {to_email})</li>
        <li>Select your lake on the map</li>
        <li>Get your complete fishing plan instantly</li>
    </ol>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <a href="{WEB_BASE_URL}" style="display: inline-block; background: #2c5f2d; color: white; padding: 12px 32px; text-decoration: none; border-radius: 5px; font-weight: bold;">Generate a Plan Now</a>
    </div>
    
    <p>Questions? Just reply to this email - we're here to help!</p>
    
    <p style="margin-top: 30px;">
        Tight lines,<br>
        The Bass Clarity Team
    </p>
</body>
</html>
    """
    
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        r.raise_for_status()
        print(f"Welcome email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send welcome email to {to_email}: {e}")


def add_to_audience(
    email: str,
    tags: list[str],
    is_member: bool = False,
) -> None:
    """
    Add email to Resend audience for marketing.
    
    Args:
        email: Email address
        tags: List of tags (e.g., ["preview_user", "not_subscribed"])
        is_member: Whether user is a paying member
    """
    if not RESEND_API_KEY:
        return
    
    # Resend Audiences API
    # https://resend.com/docs/api-reference/audiences/create-contact
    
    audience_id = os.getenv("RESEND_AUDIENCE_ID")
    if not audience_id:
        print("WARNING: RESEND_AUDIENCE_ID not set, skipping audience update")
        return
    
    try:
        r = requests.post(
            f"https://api.resend.com/audiences/{audience_id}/contacts",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "unsubscribed": False,
            },
            timeout=10,
        )
        r.raise_for_status()
        print(f"Added {email} to Resend audience")
    except Exception as e:
        print(f"Failed to add {email} to audience: {e}")