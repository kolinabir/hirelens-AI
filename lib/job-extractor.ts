/**
 * Job Post Extraction Assistant
 * Extracts structured job information from Facebook group posts
 */

interface FacebookPost {
  facebookUrl?: string;
  url?: string;
  text?: string;
  content?: string;
  user?: {
    id?: string;
    name?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  attachments?: unknown[];
}

interface JobPostExtractionResult {
  facebookUrl: string;
  user: {
    id: string;
    name: string;
  };
  likesCount: number;
  commentsCount: number;
  attachments: unknown[];

  originalPost: string;
  jobTitle: string;
  company: string;
  vacancies: number;
  location: string;
  employmentType: string;
  workingDaysHours: string;
  salary: string;
  category: string;
  experienceLevel: string;
  experienceRequired: string;
  education: string;
  technicalSkills: string[];
  niceToHaveSkills: string[];
  softSkills: string[];
  jobSummary: string;
  responsibilities: string[];
  benefits: string[];
  genderEligibility: string;
  applicationDeadline: string;
  remoteOption: boolean;
  onsiteRequired: boolean;

  howToApply: string;
  applicationMethods: Array<{
    type: string;
    value: string;
    notes: string;
  }>;
}

export class JobPostExtractor {
  /**
   * Main extraction function
   * @param input - String containing JSON array of Facebook posts
   * @returns JSON array of extracted job posts
   */
  static extractJobPosts(input: string): JobPostExtractionResult[] {
    try {
      // Parse the input string as JSON
      const posts = JSON.parse(input);

      if (!Array.isArray(posts)) {
        throw new Error("Input must be a JSON array of posts");
      }

      const jobPosts: JobPostExtractionResult[] = [];

      for (const post of posts) {
        if (this.isJobPost(post)) {
          const extractedJob = this.extractSingleJobPost(post);
          if (extractedJob) {
            jobPosts.push(extractedJob);
          }
        }
      }

      return jobPosts;
    } catch (error) {
      console.error("Error parsing input or extracting jobs:", error);
      return [];
    }
  }

  /**
   * Determines if a post is a job posting
   */
  private static isJobPost(post: FacebookPost): boolean {
    const text = (post.text || post.content || "").toLowerCase();

    // Job-related keywords
    const jobKeywords = [
      "hiring",
      "job",
      "position",
      "vacancy",
      "opportunity",
      "career",
      "developer",
      "engineer",
      "programmer",
      "designer",
      "manager",
      "analyst",
      "coordinator",
      "specialist",
      "consultant",
      "intern",
      "remote",
      "full-time",
      "part-time",
      "contract",
      "freelance",
      "apply",
      "cv",
      "resume",
      "qualification",
      "experience",
      "salary",
      "benefit",
      "requirement",
      "responsibility",
    ];

    // Check if post contains job-related keywords
    const hasJobKeywords = jobKeywords.some((keyword) =>
      text.includes(keyword)
    );

    // Additional checks for job-like structure
    const hasContactInfo = /email|phone|whatsapp|telegram|apply/i.test(text);
    const hasSkillMention = /skill|experience|year|requirement/i.test(text);

    return hasJobKeywords && (hasContactInfo || hasSkillMention);
  }

  /**
   * Extracts job information from a single post
   */
  private static extractSingleJobPost(
    post: FacebookPost
  ): JobPostExtractionResult | null {
    const text = post.text || post.content || "";

    return {
      // Basic post information
      facebookUrl: post.facebookUrl || post.url || "",
      user: {
        id: post.user?.id || "",
        name: post.user?.name || "",
      },
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      attachments: post.attachments || [],

      // Job details
      originalPost: text,
      jobTitle: this.extractJobTitle(text),
      company: this.extractCompany(text),
      vacancies: this.extractVacancies(text),
      location: this.extractLocation(text),
      employmentType: this.extractEmploymentType(text),
      workingDaysHours: this.extractWorkingDaysHours(text),
      salary: this.extractSalary(text),
      category: this.extractCategory(text),
      experienceLevel: this.extractExperienceLevel(text),
      experienceRequired: this.extractExperienceRequired(text),
      education: this.extractEducation(text),
      technicalSkills: this.extractTechnicalSkills(text),
      niceToHaveSkills: this.extractNiceToHaveSkills(text),
      softSkills: this.extractSoftSkills(text),
      jobSummary: this.extractJobSummary(text),
      responsibilities: this.extractResponsibilities(text),
      benefits: this.extractBenefits(text),
      genderEligibility: this.extractGenderEligibility(text),
      applicationDeadline: this.extractApplicationDeadline(text),
      remoteOption: this.extractRemoteOption(text),
      onsiteRequired: this.extractOnsiteRequired(text),

      // Application information
      howToApply: this.extractHowToApply(text),
      applicationMethods: this.extractApplicationMethods(text),
    };
  }

  private static extractJobTitle(text: string): string {
    // Look for patterns like "hiring [title]", "[title] position", etc.
    const patterns = [
      /(?:hiring|looking for|seeking|need)\s+(?:a\s+)?([^.\n,]+?)(?:developer|engineer|designer|manager|analyst|specialist|coordinator|intern)/i,
      /(?:position|role|job):\s*([^.\n,]+)/i,
      /([^.\n,]+?)\s+(?:developer|engineer|designer|manager|analyst|specialist|coordinator|intern)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.toTitleCase(match[1].trim());
      }
    }

    return "";
  }

  private static extractCompany(text: string): string {
    const patterns = [
      /(?:company|organization|firm):\s*([^.\n,]+)/i,
      /(?:at|@)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\n)/,
      /([A-Z][a-zA-Z\s&]+?)\s+(?:is hiring|looking for)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return "";
  }

  private static extractVacancies(text: string): number {
    const match = text.match(
      /(\d+)\s+(?:vacancy|vacancies|position|positions|opening|openings)/i
    );
    return match ? parseInt(match[1]) : 0;
  }

  private static extractLocation(text: string): string {
    const patterns = [
      /location:\s*([^.\n,]+)/i,
      /(?:in|at)\s+(dhaka|chittagong|sylhet|rajshahi|khulna|barisal|rangpur|mymensingh|bangladesh)/i,
      /(?:remote|onsite|hybrid|work from home)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return "";
  }

  private static extractEmploymentType(text: string): string {
    const types = [
      "full-time",
      "part-time",
      "contract",
      "freelance",
      "internship",
      "temporary",
    ];
    for (const type of types) {
      if (text.toLowerCase().includes(type)) {
        return this.toTitleCase(type);
      }
    }
    return "";
  }

  private static extractWorkingDaysHours(text: string): string {
    const patterns = [
      /(?:working hours?|office hours?):\s*([^.\n]+)/i,
      /(\d+)\s*(?:hours?|hrs?)\s*(?:per|\/)\s*(?:day|week)/i,
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.\n]*/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return "";
  }

  private static extractSalary(text: string): string {
    const patterns = [
      /salary:\s*([^.\n]+)/i,
      /(?:৳|tk|taka|bdt)\s*[\d,]+(?:\s*-\s*[\d,]+)?/i,
      /[\d,]+\s*(?:৳|tk|taka|bdt)/i,
      /negotiable/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return "";
  }

  private static extractCategory(text: string): string {
    const categories = [
      "software development",
      "web development",
      "mobile development",
      "data science",
      "machine learning",
      "ai",
      "cybersecurity",
      "devops",
      "qa",
      "testing",
      "ui/ux",
      "design",
      "marketing",
      "sales",
      "hr",
      "finance",
      "operations",
      "management",
    ];

    for (const category of categories) {
      if (text.toLowerCase().includes(category)) {
        return this.toTitleCase(category);
      }
    }

    return "";
  }

  private static extractExperienceLevel(text: string): string {
    if (/junior|entry.level|fresher/i.test(text)) return "Junior";
    if (/senior|lead|principal/i.test(text)) return "Senior";
    if (/mid.level|intermediate/i.test(text)) return "Mid";
    return "";
  }

  private static extractExperienceRequired(text: string): string {
    const match = text.match(
      /(\d+[\+\-]?)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i
    );
    return match ? match[1] + " years" : "";
  }

  private static extractEducation(text: string): string {
    const patterns = [
      /(?:education|qualification|degree):\s*([^.\n]+)/i,
      /(bachelor|master|phd|diploma|certificate)[^.\n]*/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return "";
  }

  private static extractTechnicalSkills(text: string): string[] {
    const skills = [
      "javascript",
      "typescript",
      "react",
      "vue",
      "angular",
      "node.js",
      "express",
      "python",
      "django",
      "flask",
      "java",
      "spring",
      "php",
      "laravel",
      "c#",
      ".net",
      "ruby",
      "rails",
      "go",
      "rust",
      "swift",
      "kotlin",
      "html",
      "css",
      "sass",
      "less",
      "bootstrap",
      "tailwind",
      "mysql",
      "postgresql",
      "mongodb",
      "redis",
      "elasticsearch",
      "aws",
      "azure",
      "gcp",
      "docker",
      "kubernetes",
      "jenkins",
      "git",
      "github",
      "gitlab",
      "jira",
      "confluence",
    ];

    const foundSkills: string[] = [];
    for (const skill of skills) {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  private static extractNiceToHaveSkills(text: string): string[] {
    const patterns = [
      /(?:nice to have|preferred|bonus|plus):\s*([^.\n]+)/i,
      /(?:additional|extra)\s+skills?:\s*([^.\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return [];
  }

  private static extractSoftSkills(text: string): string[] {
    const softSkills = [
      "communication",
      "teamwork",
      "leadership",
      "problem-solving",
      "analytical",
      "creative",
      "organized",
      "detail-oriented",
      "time management",
      "adaptability",
      "collaboration",
    ];

    const foundSkills: string[] = [];
    for (const skill of softSkills) {
      if (text.toLowerCase().includes(skill)) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  private static extractJobSummary(text: string): string {
    // Take first 100 characters and clean up
    const summary = text.substring(0, 100).replace(/\n/g, " ").trim();
    return summary + (text.length > 100 ? "..." : "");
  }

  private static extractResponsibilities(text: string): string[] {
    const patterns = [
      /(?:responsibilities|duties|tasks):\s*([^.\n]+(?:\n[^.\n]+)*)/i,
      /(?:you will|responsibilities include)[^.\n]*([^.\n]+(?:\n[^.\n]+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/[•\-\*\n]/)
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return [];
  }

  private static extractBenefits(text: string): string[] {
    const patterns = [
      /(?:benefits|perks|facilities):\s*([^.\n]+(?:\n[^.\n]+)*)/i,
      /(?:we offer|benefits include)[^.\n]*([^.\n]+(?:\n[^.\n]+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/[•\-\*\n]/)
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return [];
  }

  private static extractGenderEligibility(text: string): string {
    if (/male only|men only/i.test(text)) return "Male only";
    if (/female only|women only/i.test(text)) return "Female only";
    return "Open to all";
  }

  private static extractApplicationDeadline(text: string): string {
    const patterns = [
      /deadline:\s*([^.\n]+)/i,
      /apply (?:by|before|until)\s*([^.\n]+)/i,
      /last date:\s*([^.\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return "";
  }

  private static extractRemoteOption(text: string): boolean {
    return /remote|work from home|wfh/i.test(text);
  }

  private static extractOnsiteRequired(text: string): boolean {
    return /onsite|office|in.person/i.test(text);
  }

  private static extractHowToApply(text: string): string {
    const patterns = [
      /(?:how to apply|apply|contact):\s*([^.\n]+)/i,
      /(?:send|email|submit)[^.\n]*(?:cv|resume|application)[^.\n]*/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return "";
  }

  private static extractApplicationMethods(
    text: string
  ): Array<{ type: string; value: string; notes: string }> {
    const methods: Array<{ type: string; value: string; notes: string }> = [];

    // Email extraction
    const emailMatch = text.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (emailMatch) {
      methods.push({
        type: "email",
        value: emailMatch[1],
        notes: "",
      });
    }

    // Phone/WhatsApp extraction
    const phoneMatch = text.match(/(?:\+88)?[\s\-]?01[3-9]\d{8}/);
    if (phoneMatch) {
      const isWhatsApp = /whatsapp|wa/i.test(text);
      methods.push({
        type: isWhatsApp ? "whatsapp" : "phone",
        value: phoneMatch[0],
        notes: "",
      });
    }

    // Link extraction
    const linkMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (linkMatch) {
      methods.push({
        type: "link",
        value: linkMatch[1],
        notes: "",
      });
    }

    return methods;
  }

  private static toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

// Export function for direct use
export function extractJobPosts(input: string): string {
  const result = JobPostExtractor.extractJobPosts(input);
  return JSON.stringify(result, null, 2);
}
