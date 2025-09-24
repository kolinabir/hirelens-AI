// Database Models
export interface JobPost {
  _id?: string;
  postId: string;
  groupId: string;
  groupName: string;
  content: string;
  author: {
    name: string;
    profileUrl?: string;
    profileImage?: string;
  };
  postedDate: Date;
  engagementMetrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  jobDetails: {
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    type?: "full-time" | "part-time" | "contract" | "freelance" | "internship";
    description?: string;
    requirements?: string[];
    contactInfo?: string;
  };
  // Apify-specific fields for rich data
  apifyData?: {
    facebookUrl: string;
    user: {
      id: string;
      name: string;
    };
    likesCount: number;
    commentsCount: number;
    attachments?: Array<{
      thumbnail?: string;
      __typename: string;
      photo_image?: {
        uri: string;
        height: number;
        width: number;
      };
      url?: string;
      id?: string;
      ocrText?: string;
    }>;
  };
  scrapedAt: Date;
  isProcessed: boolean;
  isDuplicate: boolean;
  tags: string[];
  source: "apify" | "puppeteer" | "manual" | string; // Track the scraping source
  // Structured job support (external AI)
  postUrl?: string; // Unique key for structured jobs
  extractedAt?: Date; // When structured data was extracted
  processingVersion?: string; // e.g., "external_ai_v1"

  // Structured job fields from external AI processing
  jobTitle?: string;
  originalPost?: string;
  user?: {
    id?: string;
    name?: string;
  };
  facebookUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  attachments?: Array<{
    thumbnail?: string;
    __typename?: string;
    photo_image?: {
      uri: string;
      height: number;
      width: number;
    };
    url?: string;
    id?: string;
    ocrText?: string;
  }>;
  company?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  experienceLevel?: string;
  experienceRequired?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  niceToHaveSkills?: string[];
  responsibilities?: string[];
  benefits?: string[];
  education?: string;
  applicationMethods?: string[];
  applicationDeadline?: string;
  howToApply?: string;
  jobSummary?: string;
  category?: string;
  genderEligibility?: string;
  onsiteRequired?: boolean;
  remoteOption?: boolean;
  workingDaysHours?: string;
  vacancies?: number;
}

export interface FacebookGroup {
  _id?: string;
  groupId: string;
  name: string;
  url: string;
  isActive: boolean;
  lastScraped?: Date;
  totalPostsScraped: number;
  description?: string;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  _id?: string;
  email: string;
  password: string; // This should be encrypted in production
  isActive: boolean;
  lastLogin?: Date;
  failedAttempts: number;
  isBlocked: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Puppeteer Configuration Types
export interface BrowserConfig {
  headless: boolean;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  args: string[];
}

export interface ScrollConfig {
  maxScrolls: number;
  scrollDelay: number;
  waitTime: number;
  loadMoreSelector?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalJobs: number;
  todayJobs: number;
  activeGroups: number;
  activeSessions: number;
  lastUpdate: Date;
}

export interface JobFilters {
  // Basic filters
  groupId?: string;
  keywords?: string;
  location?: string;
  company?: string;

  // Employment & Experience
  jobType?: string[];
  experienceLevel?: string;
  salaryRange?: string;
  workType?: string; // remote, onsite, hybrid

  // Skills & Requirements
  skills?: string;

  // Date filters
  dateRange?:
    | string
    | {
        from: Date;
        to: Date;
      };

  // Advanced options
  hasAttachments?: boolean;
  hasDeadline?: boolean;
  hasContact?: boolean;
  highEngagement?: boolean; // Jobs with 10+ likes

  // Sorting & Pagination
  sortBy?: "date" | "engagement" | "relevance" | "title" | "company" | "likes";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;

  // Quality filter
  structuredOnly?: boolean; // Filter for structured jobs (with postUrl/extractedAt)
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface EmailSubscriber {
  _id?: string;
  email: string;
  createdAt: Date;
  isVerified?: boolean;
  lastSentAt?: Date;
  sentJobIds?: string[]; // track which job _ids sent
}

export interface TrackedWebsite {
  _id?: string;
  url: string;
  name: string;
  companyName?: string;
  isActive: boolean;
  lastScraped?: Date;
  lastJobCount: number;
  createdAt: Date;
  updatedAt: Date;
  scrapingInterval?: number; // hours between scrapes, default 24
}

export interface WebsiteJobData {
  jobTitle: string;
  positionRole: string;
  companyName: string;
  location: string;
  jobType?: string;
  experienceLevel?: string;
  department?: string;
  salaryCompensation?: string;
  jobDescriptionSummary?: string;
  requirements?: string;
  applicationDeadline?: string;
  postedDate?: string;
}

export interface WebsiteSnapshot {
  _id?: string;
  websiteId: string; // reference to TrackedWebsite._id
  websiteUrl: string;
  scrapedAt: Date;
  lastChecked?: Date; // when this snapshot was last verified (without creating new snapshot)
  jobCount: number;
  jobs: WebsiteJobData[];
  newJobsFound?: number; // compared to previous snapshot
  newJobs?: WebsiteJobData[]; // only the new jobs
  rawApiResponse?: any; // store full Smyth AI response for debugging
}
