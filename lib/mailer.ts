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

  const subject = `🔍 HireLens Job Updates - ${jobs.length} New Opportunities`;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const htmlItems = jobs
    .map((j, idx) => {
      const title = j.title || "Untitled Role";
      const company = j.company ? ` at ${j.company}` : "";
      const location = j.location ? ` — ${j.location}` : "";
      const deadline = j.deadline ? ` | Deadline: ${j.deadline}` : "";
      const applyLink = j.url
        ? `<a href="${j.url}" style="color: #3b82f6; text-decoration: none; margin-right: 10px; background: #dbeafe; padding: 8px 16px; border-radius: 8px; font-weight: 600;">Apply Now</a>`
        : "";
      const previewLink = `<a href="${baseUrl}/dashboard/jobs?search=${encodeURIComponent(
        title
      )}" style="color: #10b981; text-decoration: none; background: #dcfce7; padding: 8px 16px; border-radius: 8px; font-weight: 600;">Preview Job</a>`;

      return `
        <li style="margin-bottom: 20px; padding: 20px; border-left: 4px solid #3b82f6; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <strong style="color: #1e40af; font-size: 18px; display: block; margin-bottom: 8px;">${
            idx + 1
          }. ${title}${company}</strong>
          <div style="color: #64748b; margin-bottom: 12px; font-size: 14px;">${location}${deadline}</div>
          <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${applyLink}${previewLink}
          </div>
        </li>`;
    })
    .join("");

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="display: inline-flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 style="color: white; font-size: 32px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">HireLens</h1>
        </div>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">AI-Powered Job Discovery Platform</p>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 16px; font-weight: 700;">🎯 Your Latest Job Opportunities</h2>
        <p style="color: #64748b; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">
          We've found ${jobs.length} exciting new job opportunities that match your profile. Each opportunity has been carefully analyzed by our AI to ensure quality and relevance.
        </p>

        <ul style="list-style: none; padding: 0; margin: 0;">
          ${htmlItems}
        </ul>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); display: inline-block; transition: all 0.3s ease;">
            🚀 Explore All Jobs on HireLens
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
            <span style="font-weight: 700; color: #1e293b; font-size: 18px;">HireLens</span>
          </div>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            You're receiving this because you subscribed to HireLens job updates.
          </p>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2024 HireLens. All rights reserved. Built with ❤️ for job seekers.
          </p>
        </div>
      </div>
    </div>
`;

  const text = `🔍 HireLens Job Updates - ${jobs.length} New Opportunities

Hi there!

We've found ${
    jobs.length
  } exciting new job opportunities that match your profile. Each opportunity has been carefully analyzed by our AI to ensure quality and relevance.

${jobs
  .map(
    (j, idx) =>
      `${idx + 1}. ${j.title || "Untitled Role"}${
        j.company ? ` at ${j.company}` : ""
      }${j.location ? ` — ${j.location}` : ""}${
        j.deadline ? ` | Deadline: ${j.deadline}` : ""
      }
Apply: ${j.url || "N/A"}
Preview: ${baseUrl}/dashboard/jobs?search=${encodeURIComponent(j.title || "")}`
  )
  .join("\n\n")}

🚀 Explore all jobs on HireLens: ${baseUrl}/dashboard

---
© 2024 HireLens. All rights reserved. Built with ❤️ for job seekers.
You're receiving this because you subscribed to HireLens job updates.`;

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
