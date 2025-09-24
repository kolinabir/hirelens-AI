import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface MailJobDigestItem {
  title?: string;
  company?: string;
  location?: string;
  url?: string;
}

export async function createTransport() {
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

export async function sendJobDigestEmail(
  toEmail: string,
  jobs: MailJobDigestItem[]
) {
  console.log(
    `📧 Attempting to send email to ${toEmail} with ${jobs.length} jobs`
  );
  console.log("SMTP Config:", {
    host: env.smtpHost,
    port: env.smtpPort,
    user: env.smtpUser,
    from: env.smtpFromEmail,
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs to send, skipping email");
    return;
  }

  const transporter = await createTransport();

  // Test connection first
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
  } catch (verifyError) {
    console.error("❌ SMTP verification failed:", verifyError);
    throw new Error(`SMTP verification failed: ${verifyError}`);
  }

  const subject = `Your job updates (${jobs.length} new)`;
  const htmlItems = jobs
    .map((j, idx) => {
      const title = j.title || "Untitled Role";
      const company = j.company ? ` at ${j.company}` : "";
      const location = j.location ? ` — ${j.location}` : "";
      const url = j.url ? `<a href="${j.url}">${j.url}</a>` : "";
      return `<li><strong>${
        idx + 1
      }. ${title}${company}${location}</strong><br/>${url}</li>`;
    })
    .join("");

  const html = `
    <div>
      <p>Here are your latest job updates:</p>
      <ol>
        ${htmlItems}
      </ol>
      <p>You're receiving this because you subscribed to job updates.</p>
    </div>
  `;

  const text = `Here are your latest job updates:\n\n${jobs
    .map(
      (j, idx) =>
        `${idx + 1}. ${j.title || "Untitled Role"}${
          j.company ? ` at ${j.company}` : ""
        }${j.location ? ` — ${j.location}` : ""}\n${j.url || ""}`
    )
    .join("\n\n")}`;

  console.log("📧 Sending email with subject:", subject);
  console.log("📧 Jobs data:", jobs);

  const result = await transporter.sendMail({
    from: env.smtpFromEmail,
    to: toEmail,
    subject,
    text,
    html,
  });

  console.log("✅ Email sent successfully:", result.messageId);
  return result;
}
