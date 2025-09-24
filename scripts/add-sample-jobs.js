#!/usr/bin/env node

/**
 * Script to add sample structured jobs to the database
 * Usage: node scripts/add-sample-jobs.js
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_scraper';

const sampleJobs = [
  {
    postId: `sample-post-${Date.now()}-1`,
    postUrl: "https://facebook.com/sample-job-1",
    jobTitle: "Senior Full Stack Developer",
    company: "TechCorp Bangladesh",
    location: "Dhaka, Bangladesh",
    salary: "80,000 - 1,20,000 BDT",
    employmentType: "full-time",
    experienceRequired: "3+ years",
    technicalSkills: ["JavaScript", "TypeScript", "React.js", "Node.js", "MongoDB", "PostgreSQL", "AWS", "Docker"],
    responsibilities: [
      "Develop and maintain web applications",
      "Collaborate with cross-functional teams", 
      "Code review and mentoring junior developers"
    ],
    benefits: ["Health insurance", "Flexible working hours", "Professional development budget"],
    applicationMethods: [
      {
        type: "email",
        value: "careers@techcorp.com",
        notes: "Send CV with subject: Senior Full Stack Developer Application"
      },
      {
        type: "whatsapp",
        value: "+8801712345678",
        notes: "WhatsApp for quick contact"
      }
    ],
    applicationDeadline: "2025-12-30",
    remoteOption: true,
    user: {
      id: "user123",
      name: "John Doe"
    },
    likesCount: 15,
    commentsCount: 5,
    attachments: [],
    originalPost: "🚀 We are hiring Full Stack Developer at TechCorp!\n\nPosition: Senior Full Stack Developer\nCompany: TechCorp Bangladesh\nExperience: 3+ years required\nLocation: Dhaka, Bangladesh (Remote option available)\nSalary: 80,000 - 1,20,000 BDT (Negotiable)\n\nRequired Skills:\n- JavaScript, TypeScript\n- React.js, Node.js\n- MongoDB, PostgreSQL\n- AWS, Docker\n\nResponsibilities:\n- Develop and maintain web applications\n- Collaborate with cross-functional teams\n- Code review and mentoring junior developers\n\nBenefits:\n- Health insurance\n- Flexible working hours\n- Professional development budget\n\nHow to Apply:\nSend your CV to careers@techcorp.com or WhatsApp: +8801712345678\nSubject: Senior Full Stack Developer Application\n\nDeadline: 30th December 2025",
    source: "facebook_sample_data",
    extractedAt: new Date(),
    processingVersion: "sample_v1"
  },
  {
    postId: `sample-post-${Date.now()}-2`,
    postUrl: "https://facebook.com/sample-job-2", 
    jobTitle: "UI/UX Designer",
    company: "StartupXYZ",
    location: "Dhaka, Bangladesh",
    salary: "40,000 - 60,000 BDT",
    employmentType: "full-time",
    experienceRequired: "1-2 years or fresh graduate",
    technicalSkills: ["Figma", "Adobe XD", "Prototyping", "User Research", "HTML/CSS"],
    responsibilities: [
      "Design user interfaces for web and mobile applications",
      "Conduct user research and usability testing",
      "Create wireframes and prototypes"
    ],
    benefits: ["Creative work environment", "Learning opportunities", "Team outings"],
    applicationMethods: [
      {
        type: "email",
        value: "design@startupxyz.com",
        notes: "Send portfolio with CV"
      }
    ],
    applicationDeadline: "2025-11-15",
    remoteOption: false,
    user: {
      id: "user456",
      name: "Jane Smith"
    },
    likesCount: 8,
    commentsCount: 2,
    attachments: [],
    originalPost: "Looking for a UI/UX Designer for our startup!\n\nPosition: Junior UI/UX Designer\nCompany: StartupXYZ\nExperience: 1-2 years or fresh graduate\nLocation: Dhaka, Bangladesh\nSalary: 40,000 - 60,000 BDT\n\nRequired Skills:\n- Figma, Adobe XD\n- Prototyping\n- User Research\n- HTML/CSS basics\n\nContact: design@startupxyz.com",
    source: "facebook_sample_data",
    extractedAt: new Date(),
    processingVersion: "sample_v1"
  },
  {
    postId: `sample-post-${Date.now()}-3`,
    postUrl: "https://facebook.com/sample-job-3",
    jobTitle: "Senior Python Developer", 
    company: "DataTech Solutions",
    location: "Remote (Bangladesh timezone)",
    salary: "1,00,000 - 1,50,000 BDT",
    employmentType: "full-time",
    experienceRequired: "4+ years",
    technicalSkills: ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "GCP"],
    responsibilities: [
      "Develop scalable backend systems",
      "Design and implement APIs",
      "Optimize database performance",
      "Deploy and maintain cloud infrastructure"
    ],
    benefits: ["Remote work", "Competitive salary", "Health insurance", "Annual bonus"],
    applicationMethods: [
      {
        type: "email",
        value: "hr@datatech.com",
        notes: "Apply ASAP - urgent hiring"
      }
    ],
    applicationDeadline: "ASAP",
    remoteOption: true,
    user: {
      id: "user789",
      name: "Mike Johnson"
    },
    likesCount: 25,
    commentsCount: 12,
    attachments: [],
    originalPost: "🔥 URGENT HIRING: Python Developer\n\nPosition: Senior Python Developer\nCompany: DataTech Solutions\nExperience: 4+ years\nLocation: Remote (Bangladesh timezone)\nSalary: 1,00,000 - 1,50,000 BDT\n\nTech Stack:\n- Python, Django, FastAPI\n- PostgreSQL, Redis\n- Docker, Kubernetes\n- AWS/GCP\n\nApply now: hr@datatech.com\nDeadline: ASAP",
    source: "facebook_sample_data",
    extractedAt: new Date(),
    processingVersion: "sample_v1"
  },
  {
    postId: `sample-post-${Date.now()}-4`,
    postUrl: "https://facebook.com/sample-job-4",
    jobTitle: "Frontend Developer",
    company: "WebTech Ltd",
    location: "Chittagong, Bangladesh",
    salary: "50,000 - 75,000 BDT",
    employmentType: "full-time",
    experienceRequired: "2-3 years",
    technicalSkills: ["React.js", "Vue.js", "JavaScript", "TypeScript", "CSS3", "SASS", "Webpack", "Git"],
    responsibilities: [
      "Build responsive web applications",
      "Implement modern UI/UX designs",
      "Optimize application performance",
      "Collaborate with backend developers"
    ],
    benefits: ["Flexible hours", "Training budget", "Team events"],
    applicationMethods: [
      {
        type: "email",
        value: "jobs@webtech.com",
        notes: "Include GitHub profile"
      }
    ],
    applicationDeadline: "2025-11-30",
    remoteOption: false,
    user: {
      id: "user101",
      name: "Sarah Ahmed"
    },
    likesCount: 12,
    commentsCount: 7,
    attachments: [],
    originalPost: "Frontend Developer needed at WebTech Ltd!\n\nPosition: Frontend Developer\nCompany: WebTech Ltd\nExperience: 2-3 years\nLocation: Chittagong, Bangladesh\nSalary: 50,000 - 75,000 BDT\n\nSkills: React.js, Vue.js, JavaScript, TypeScript\n\nApply: jobs@webtech.com",
    source: "facebook_sample_data",
    extractedAt: new Date(),
    processingVersion: "sample_v1"
  },
  {
    postId: `sample-post-${Date.now()}-5`,
    postUrl: "https://facebook.com/sample-job-5",
    jobTitle: "DevOps Engineer",
    company: "CloudFirst Technologies",
    location: "Dhaka, Bangladesh",
    salary: "90,000 - 1,30,000 BDT",
    employmentType: "full-time",
    experienceRequired: "3-5 years",
    technicalSkills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Linux", "Python", "Bash"],
    responsibilities: [
      "Manage cloud infrastructure",
      "Implement CI/CD pipelines",
      "Monitor system performance",
      "Automate deployment processes"
    ],
    benefits: ["Cloud certifications", "Remote work options", "Performance bonus"],
    applicationMethods: [
      {
        type: "email",
        value: "devops@cloudfirst.com",
        notes: "Include AWS certifications if any"
      }
    ],
    applicationDeadline: "2025-12-15",
    remoteOption: true,
    user: {
      id: "user202",
      name: "Rahman Khan"
    },
    likesCount: 18,
    commentsCount: 9,
    attachments: [],
    originalPost: "DevOps Engineer opportunity at CloudFirst Technologies!\n\nPosition: DevOps Engineer\nCompany: CloudFirst Technologies\nExperience: 3-5 years\nLocation: Dhaka, Bangladesh\nSalary: 90,000 - 1,30,000 BDT\n\nSkills: AWS, Docker, Kubernetes, Jenkins, Terraform\n\nContact: devops@cloudfirst.com",
    source: "facebook_sample_data",
    extractedAt: new Date(),
    processingVersion: "sample_v1"
  }
];

async function addSampleJobs() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const jobsCollection = db.collection('job_posts');
    
    console.log('🔄 Adding sample jobs to database...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const job of sampleJobs) {
      try {
        // Check if job already exists
        const existing = await jobsCollection.findOne({ postUrl: job.postUrl });
        if (existing) {
          console.log(`⏭️  Skipping existing job: ${job.jobTitle} at ${job.company}`);
          skippedCount++;
          continue;
        }
        
        // Insert the job
        await jobsCollection.insertOne(job);
        console.log(`✅ Added job: ${job.jobTitle} at ${job.company}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Error adding job ${job.jobTitle}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Sample jobs added successfully!`);
    console.log(`📊 Added: ${addedCount}, Skipped: ${skippedCount}, Total: ${sampleJobs.length}`);
    
  } catch (error) {
    console.error('❌ Error adding sample jobs:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addSampleJobs();