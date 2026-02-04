import requests

from app.core.config import settings


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        print("SendGrid API key is not configured.")
        return False
    if not settings.FROM_EMAIL:
        print("FROM_EMAIL is not configured.")
        return False

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": settings.FROM_EMAIL},
        "subject": subject,
        "content": [{"type": "text/html", "value": html_content}],
    }

    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        json=payload,
        headers=headers,
        timeout=10,
    )

    if response.status_code >= 400:
        print(f"SendGrid error: {response.status_code} {response.text}")
        return False

    return True


def send_verification_email(to_email: str, code: str) -> bool:
    subject = "Verify your ApplyPilot account"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Use the verification code below to confirm your account:</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
        {code}
      </div>
      <p>This code expires in {settings.EMAIL_VERIFICATION_EXPIRE_MINUTES} minutes.</p>
    </div>
    """
    return send_email(to_email, subject, html_content)


def send_password_reset_email(to_email: str, code: str) -> bool:
    subject = "Reset your ApplyPilot password"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Password reset</h2>
      <p>Use the reset code below to set a new password:</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
        {code}
      </div>
      <p>This code expires in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.</p>
    </div>
    """
    return send_email(to_email, subject, html_content)
