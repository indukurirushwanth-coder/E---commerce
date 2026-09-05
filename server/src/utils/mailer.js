// Email service abstraction.
// In production, plug in your provider (e.g. SendGrid / AWS SES / Nodemailer + SMTP).
// For local development, emails are logged to console and the link is returned.
const config = require('../config');

function sendMail({ to, subject, text, html }) {
  const send = async () => {
    if (config.NODE_ENV === 'production') {
      // Example with a provider:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_KEY);
      // await sgMail.send({ to, from: process.env.MAIL_FROM, subject, text, html });
      throw new Error('Email provider not configured. Set SENDGRID_KEY or an SMTP provider.');
    }
    // Dev mode: log instead of sending.
    console.log(`[MAIL] to=${to} subject=${subject}`);
    console.log(`[MAIL] body=${text}`);
  };
  return send();
}

module.exports = { sendMail };