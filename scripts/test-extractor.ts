#!/usr/bin/env ts-node

/**
 * Job Post Extraction Test Utility
 * Usage: npx ts-node scripts/test-extractor.ts "facebook_posts_json_string"
 */

import { JobPostExtractor } from "../lib/job-extractor";

// Sample Facebook posts for testing
const samplePosts = JSON.stringify([
  {
    facebookUrl: "https://www.facebook.com/groups/devforhire/posts/123456",
    user: {
      id: "user123",
      name: "John Doe",
    },
    likesCount: 15,
    commentsCount: 5,
    attachments: [],
    text: `🚀 We are hiring Full Stack Developer at TechCorp!

Position: Senior Full Stack Developer
Company: TechCorp Bangladesh
Experience: 3+ years required
Location: Dhaka, Bangladesh (Remote option available)
Salary: 80,000 - 1,20,000 BDT (Negotiable)

Required Skills:
- JavaScript, TypeScript
- React.js, Node.js
- MongoDB, PostgreSQL
- AWS, Docker

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Code review and mentoring junior developers

Benefits:
- Health insurance
- Flexible working hours
- Professional development budget

How to Apply:
Send your CV to careers@techcorp.com or WhatsApp: +8801712345678
Subject: Senior Full Stack Developer Application

Deadline: 30th December 2025`,
  },
  {
    facebookUrl: "https://www.facebook.com/groups/devforhire/posts/789012",
    user: {
      id: "user456",
      name: "Jane Smith",
    },
    likesCount: 8,
    commentsCount: 2,
    attachments: [],
    text: `Looking for a UI/UX Designer for our startup!

Position: Junior UI/UX Designer
Company: StartupXYZ
Experience: 1-2 years or fresh graduate
Location: Gulshan, Dhaka (Onsite required)
Employment Type: Full-time
Working Hours: 9 AM - 6 PM, Sunday to Thursday

Skills Required:
- Figma, Adobe XD
- Photoshop, Illustrator
- HTML/CSS knowledge is a plus
- Strong communication skills
- Creative thinking

Education: Bachelor's degree in Design or related field

Salary: 35,000 - 50,000 BDT

Apply by filling this form: https://forms.google.com/xyz123
Or email your portfolio to design@startupxyz.com

Gender: Open to all
Application Deadline: 15th January 2026`,
  },
  {
    facebookUrl: "https://www.facebook.com/groups/devforhire/posts/345678",
    user: {
      id: "user789",
      name: "Not A Job",
    },
    likesCount: 3,
    commentsCount: 1,
    attachments: [],
    text: `Just wanted to share my weekend coding project! Built a cool weather app using React and OpenWeatherMap API.

Check it out: https://myweatherapp.com

Thanks to this amazing community for all the learning resources! 🙌`,
  },
]);

function testExtractor() {
  console.log("🧪 Testing Job Post Extractor\n");

  // Get input from command line or use sample
  const input = process.argv[2] || samplePosts;

  console.log("📥 Input:");
  console.log(input);
  console.log("\n" + "=".repeat(80) + "\n");

  try {
    const result = JobPostExtractor.extractJobPosts(input);

    console.log("📤 Extracted Job Posts:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n📊 Summary:");
    console.log(`- Total posts processed: ${JSON.parse(input).length}`);
    console.log(`- Job posts extracted: ${result.length}`);
    console.log(
      `- Non-job posts filtered: ${JSON.parse(input).length - result.length}`
    );
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExtractor();
}

export { testExtractor };
