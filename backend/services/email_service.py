"""
StatIQ Email Service
Dark mode email templates that work in Gmail.
"""

import os
import secrets
from typing import Optional
from pathlib import Path

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

import resend

# Configure Resend
resend.api_key = os.getenv("RESEND_API_KEY")

# Email configuration
FROM_EMAIL = os.getenv("STATIQ_FROM_EMAIL", "noreply@usestatiq.com")
SUPPORT_EMAIL = os.getenv("STATIQ_SUPPORT_EMAIL", "support@usestatiq.com")
BASE_URL = os.getenv("STATIQ_BASE_URL", "https://app.usestatiq.com")

# Assets
LOGO_URL = "https://usestatiq.com/assets/WebLogo.png"
DAW_URL = "https://usestatiq.com/assets/data-always-wins-light.png"
BG_URL = "https://usestatiq.com/assets/basalt-bg.jpg"

# Brand colors
SURGE = "#B4D836"


def generate_invitation_token() -> str:
    """Generate a secure random token for invitation links"""
    return secrets.token_urlsafe(32)


def _base_template(content: str, preview_text: str = "") -> str:
    """Dark mode email template that works in Gmail."""
    return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StatIQ</title>
</head>
<body style="margin:0; padding:0;">
<div style="display:none; max-height:0; overflow:hidden;">{preview_text}</div>
<center>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" background="{BG_URL}" style="background-image:url({BG_URL}); background-color:#262626; background-size:cover;">

<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
<v:fill type="tile" src="{BG_URL}" color="#262626"/>
<v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
<![endif]-->

<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

<!-- Logo -->
<tr><td align="center" style="padding:32px 32px 24px;">
<img src="{LOGO_URL}" alt="StatIQ" width="140" style="display:block;"/>
</td></tr>

{content}

<!-- Footer -->
<tr><td align="center" style="padding:24px 32px;">
<img src="{DAW_URL}" alt="Data Always Wins" width="160" style="display:block; margin:0 auto 12px;"/>
<div style="font-size:12px;"><font color="#808080">© 2025 StatIQ Analytics, LLC</font></div>
</td></tr>

</table>

<!--[if gte mso 9]>
</v:textbox>
</v:rect>
<![endif]-->

</td>
</tr>
</table>
</center>
</body>
</html>'''


def _button(text: str, url: str) -> str:
    """SURGE green button"""
    return f'''<table cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td align="center" bgcolor="{SURGE}" style="border-radius:8px;">
<a href="{url}" target="_blank" style="display:inline-block; padding:14px 40px; font-size:15px; font-weight:700; color:#262626; text-decoration:none;">{text}</a>
</td>
</tr>
</table>'''


def send_coach_invitation_email(
    to_email: str,
    to_name: Optional[str],
    team_name: str,
    inviter_name: str,
    invitation_token: str,
    role: str = "coach"
) -> dict:
    """Send an invitation email to a coach"""
    
    accept_url = f"{BASE_URL}/accept-invite?token={invitation_token}"
    greeting = to_name.split()[0] if to_name else "Coach"
    role_display = "an administrator" if role == "admin" else "a coach"
    
    content = f'''
<tr><td style="padding:0 32px 32px;">
<div style="font-size:15px; margin-bottom:8px;"><font color="#a0a0a0">Hey {greeting},</font></div>
<div style="font-size:15px; line-height:24px; margin-bottom:24px;">
<font color="#a0a0a0"><font color="#e0e0e0">{inviter_name}</font> invited you to join <font color="{SURGE}">{team_name}</font> as {role_display} on StatIQ.</font>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1a1a1a" style="border-radius:12px; margin-bottom:24px;">
<tr><td style="padding:16px 20px;">
<div style="margin-bottom:12px;"><font color="#e0e0e0">⚡ <b>Real-Time Stats</b></font><br/><font color="#808080">5-15 second delivery, not 12-24 hours</font></div>
<div style="margin-bottom:12px;"><font color="#e0e0e0">✓ <b>99.9% Accuracy</b></font><br/><font color="#808080">Human-verified, not AI guesswork</font></div>
<div><font color="#e0e0e0">📊 <b>District Intel</b></font><br/><font color="#808080">Scout opponents with real data</font></div>
</td></tr>
</table>

{_button("Accept Invitation", accept_url)}

<div style="text-align:center; margin-top:20px;"><font color="#666666" style="font-size:12px;">This invitation expires in 7 days</font></div>
</td></tr>'''
    
    html = _base_template(content, f"{inviter_name} invited you to join {team_name}")
    
    return resend.Emails.send({
        "from": f"StatIQ <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"🏈 {inviter_name} invited you to join {team_name}",
        "html": html,
        "reply_to": SUPPORT_EMAIL,
    })


def send_player_invitation_email(
    to_email: str,
    to_name: Optional[str],
    team_name: str,
    inviter_name: str,
    invitation_token: str,
) -> dict:
    """Send an invitation email to a player"""
    
    accept_url = f"{BASE_URL}/accept-invite?token={invitation_token}"
    greeting = to_name.split()[0] if to_name else "there"
    
    content = f'''
<tr><td style="padding:0 32px 32px;">
<div style="font-size:15px; margin-bottom:8px;"><font color="#a0a0a0">Hey {greeting},</font></div>
<div style="font-size:15px; line-height:24px; margin-bottom:24px;">
<font color="#a0a0a0"><font color="#e0e0e0">Coach {inviter_name}</font> invited you to join <font color="{SURGE}">{team_name}</font> on StatIQ.</font>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1a1a1a" style="border-radius:12px; margin-bottom:24px;">
<tr><td style="padding:16px 20px;">
<div style="margin-bottom:12px;"><font color="#e0e0e0">📈 <b>Track Your Stats</b></font><br/><font color="#808080">Every game, every play, every yard</font></div>
<div style="margin-bottom:12px;"><font color="#e0e0e0">🎯 <b>Recruiting Profile</b></font><br/><font color="#808080">Share your numbers with scouts</font></div>
<div><font color="#e0e0e0">🏆 <b>District Rankings</b></font><br/><font color="#808080">See where you stack up</font></div>
</td></tr>
</table>

{_button("Join the Team", accept_url)}

<div style="text-align:center; margin-top:20px;"><font color="#666666" style="font-size:12px;">This invitation expires in 7 days</font></div>
</td></tr>'''
    
    html = _base_template(content, f"Coach {inviter_name} invited you to join {team_name}")
    
    return resend.Emails.send({
        "from": f"StatIQ <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"🏈 Coach {inviter_name} wants you on {team_name}",
        "html": html,
        "reply_to": SUPPORT_EMAIL,
    })


def send_welcome_email(
    to_email: str,
    to_name: str,
    role: str,
    team_name: Optional[str] = None,
    temp_password: Optional[str] = None,
) -> dict:
    """Send a welcome email when an account is created"""
    
    login_url = f"{BASE_URL}/login"
    first_name = to_name.split()[0] if to_name else "there"
    
    password_html = ""
    if temp_password:
        password_html = f'''
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2d2d00" style="border:1px solid #4d4d00; border-radius:12px; margin-bottom:24px;">
<tr><td style="padding:16px 20px;">
<div style="margin-bottom:8px;"><font color="#cccc00" style="font-size:12px; font-weight:700;">🔐 TEMPORARY PASSWORD</font></div>
<div style="padding:10px 14px; background-color:#262626; border-radius:6px; margin-bottom:8px;"><font color="#ffffff" style="font-family:monospace; font-size:18px; letter-spacing:1px;">{temp_password}</font></div>
<div><font color="#999900" style="font-size:12px;">Change this after your first login</font></div>
</td></tr>
</table>'''
    
    if role == "player":
        features = '''
<div style="margin-bottom:12px;"><font color="#e0e0e0">📈 <b>Your Stats Dashboard</b></font><br/><font color="#808080">All your game stats in one place</font></div>
<div style="margin-bottom:12px;"><font color="#e0e0e0">🎯 <b>Recruiting Profile</b></font><br/><font color="#808080">Share your numbers with scouts</font></div>
<div><font color="#e0e0e0">🏆 <b>District Rankings</b></font><br/><font color="#808080">See where you stack up</font></div>'''
    else:
        features = '''
<div style="margin-bottom:12px;"><font color="#e0e0e0">⚡ <b>Real-Time Stats</b></font><br/><font color="#808080">5-15 second delivery during games</font></div>
<div style="margin-bottom:12px;"><font color="#e0e0e0">👥 <b>Team Management</b></font><br/><font color="#808080">Invite players and coaches</font></div>
<div><font color="#e0e0e0">📊 <b>District Analytics</b></font><br/><font color="#808080">Scout opponents with real data</font></div>'''
    
    team_text = f' for <font color="{SURGE}">{team_name}</font>' if team_name else ""
    
    content = f'''
<tr><td style="padding:0 32px 32px;">
<div style="font-size:15px; margin-bottom:8px;"><font color="#a0a0a0">Hey {first_name},</font></div>
<div style="font-size:15px; line-height:24px; margin-bottom:24px;">
<font color="#a0a0a0">Welcome to StatIQ! Your account has been created{team_text}.</font>
</div>

{password_html}

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1a1a1a" style="border-radius:12px; margin-bottom:24px;">
<tr><td style="padding:16px 20px;">
{features}
</td></tr>
</table>

{_button("Log In", login_url)}

<div style="text-align:center; margin-top:20px;"><font color="#666666" style="font-size:12px;">Questions? Just reply to this email.</font></div>
</td></tr>'''
    
    html = _base_template(content, f"Welcome to StatIQ, {first_name}!")
    
    return resend.Emails.send({
        "from": f"StatIQ <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"🎉 Welcome to StatIQ, {first_name}!",
        "html": html,
        "reply_to": SUPPORT_EMAIL,
    })


def send_invitation_reminder_email(
    to_email: str,
    to_name: Optional[str],
    team_name: str,
    inviter_name: str,
    invitation_token: str,
    role: str,
    days_remaining: int = 3,
) -> dict:
    """Send a reminder for pending invitations"""
    
    accept_url = f"{BASE_URL}/accept-invite?token={invitation_token}"
    greeting = to_name.split()[0] if to_name else "there"
    
    content = f'''
<tr><td style="padding:0 32px 32px;">
<div style="font-size:15px; margin-bottom:8px;"><font color="#a0a0a0">Hey {greeting},</font></div>
<div style="font-size:15px; line-height:24px; margin-bottom:24px;">
<font color="#a0a0a0">Quick reminder: <font color="#e0e0e0">{inviter_name}</font> invited you to join <font color="{SURGE}">{team_name}</font> on StatIQ.</font>
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2d2d00" style="border:1px solid #4d4d00; border-radius:12px; margin-bottom:24px;">
<tr><td style="padding:14px 20px;">
<font color="#cccc00">⏰ This invitation expires in <b>{days_remaining} days</b></font>
</td></tr>
</table>

{_button("Accept Invitation", accept_url)}
</td></tr>'''
    
    html = _base_template(content, f"Your invitation to {team_name} expires soon")
    
    return resend.Emails.send({
        "from": f"StatIQ <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"⏰ Your {team_name} invitation expires soon",
        "html": html,
        "reply_to": SUPPORT_EMAIL,
    })


def send_test_email(to_email: str) -> dict:
    """Send a test email to verify integration"""
    
    content = '''
<tr><td align="center" style="padding:0 32px 32px;">
<div style="font-size:48px; margin-bottom:16px;">✅</div>
<div style="font-size:24px; font-weight:700; margin-bottom:16px;"><font color="#e0e0e0">Email Test Successful</font></div>
<div style="font-size:15px;"><font color="#a0a0a0">Dark mode is working.</font></div>
</td></tr>'''
    
    html = _base_template(content, "StatIQ email test")
    
    return resend.Emails.send({
        "from": "StatIQ <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "✅ StatIQ Email Test",
        "html": html,
    })
