let warned = false

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    if (!warned) {
      console.warn('[email-service] SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable email notifications')
      warned = true
    }
    return
  }

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass },
    })

    const from = process.env.SMTP_FROM || 'noreply@resnor.app'
    await transporter.sendMail({ from, to, subject, text, html: html || text })
  } catch (err) {
    console.error('[email-service] Failed to send email:', err)
  }
}
