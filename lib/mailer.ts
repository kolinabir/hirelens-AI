import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface MailJobDigestItem {
  title?: string;
  company?: string;
  location?: string;
  url?: string;
  deadline?: string;
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
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  
  const htmlItems = jobs
    .map((j, idx) => {
      const title = j.title || "Untitled Role";
      const company = j.company ? ` at ${j.company}` : "";
      const location = j.location ? ` — ${j.location}` : "";
      const deadline = j.deadline ? ` | Deadline: ${j.deadline}` : "";
      const applyLink = j.url ? `<a href="${j.url}" style="color: #3b82f6; text-decoration: none; margin-right: 10px;">Apply Now</a>` : "";
      const previewLink = `<a href="${baseUrl}/dashboard/jobs?search=${encodeURIComponent(title)}" style="color: #10b981; text-decoration: none;">Preview Job</a>`;
      
      return `
        <li style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #3b82f6; background-color: #f8fafc;">
          <strong style="color: #1e40af;">${idx + 1}. ${title}${company}${location}${deadline}</strong>
          <div style="margin-top: 8px;">
            ${applyLink}${previewLink}
          </div>
        </li>`;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Your Job Updates</h2>
      <p style="color: #374151; margin-bottom: 20px;">Here are your latest job updates:</p>
      <ul style="list-style: none; padding: 0;">
        ${htmlItems}
      </ul>
      <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          You're receiving this because you subscribed to job updates. 
          <a href="${baseUrl}/dashboard" style="color: #3b82f6;">Visit Dashboard</a>
        </p>
      </div>
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
