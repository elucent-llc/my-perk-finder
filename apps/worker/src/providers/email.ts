import { env } from "../env.js";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend in prod; logs to console when MOCK_EXTERNAL=true
 * so the worker runs with no Resend account.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ id: string; mocked: boolean }> {
  if (env.MOCK_EXTERNAL) {
    console.log(`✉️  [mock email] → ${input.to} · "${input.subject}"`);
    return { id: `mock_${Date.now()}`, mocked: true };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  const res = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { id: res.data?.id ?? "unknown", mocked: false };
}
