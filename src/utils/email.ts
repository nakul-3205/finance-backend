import nodemailer from 'nodemailer';

export async function sendResetEmail(to: string, name: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured — log to console for local development
    console.log('\n====================================');
    console.log('  PASSWORD RESET (no SMTP configured)');
    console.log(`  To   : ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  URL  : ${resetUrl}`);
    console.log('====================================\n');
    return;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to,
    subject: 'Reset your Finance Dashboard password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>Someone requested a password reset for your account. Click below to proceed:</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}"
             style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </p>
        <p>This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore it.</p>
        <p style="color:#888;font-size:13px">— Finance Dashboard</p>
      </div>
    `,
  });
}
