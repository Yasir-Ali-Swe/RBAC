import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
      : undefined,
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@company.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  return await transporter.sendMail(mailOptions);
};

export interface SendInvitationEmailParams {
  name: string;
  email: string;
  roleName: string;
  invitationUrl: string;
  expiryHours: number;
}

export const sendInvitationEmail = async ({
  name,
  email,
  roleName,
  invitationUrl,
  expiryHours,
}: SendInvitationEmailParams) => {
  const subject = "You have been invited to join our company platform";

  const text = `Hello ${name},

You have been invited to join the company platform as a ${roleName}.
Please complete your account setup using the link below:

${invitationUrl}

This invitation expires in ${expiryHours} hours.

If you were not expecting this invitation, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4a4a;
      margin-bottom: 28px;
    }
    .role-badge {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 16px;
    }
    .footer {
      font-size: 13px;
      color: #888888;
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
      margin-top: 28px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Platform Invitation</div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been invited to join the company platform as a <span class="role-badge">${roleName}</span>.</p>
      <p>Please complete your account setup using the button below:</p>
      <div class="button-container">
        <a href="${invitationUrl}" class="btn" target="_blank">Complete Account Setup</a>
      </div>
      <p>This invitation expires in <strong>${expiryHours} hours</strong>.</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${invitationUrl}</p>
      <p>If you were not expecting this invitation, please safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};
