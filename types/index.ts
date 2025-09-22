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
  scrapedAt: Date;
  isProcessed: boolean;
  isDuplicate: boolean;
  tags: string[];
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

export interface ScrapingSession {
  _id?: string;
  sessionId: string;
  groupId: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed" | "paused";
  postsScraped: number;
  errorCount: number;
  lastError?: string;
  progress: {
    currentPage: number;
    estimatedTotal?: number;
  };
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

export interface ScrapingJobRequest {
  groupUrls: string[];
  maxPosts?: number;
  filters?: {
    keywords?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
}

export interface ScrapingJobResponse {
  jobId: string;
  status: string;
  message: string;
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
  groupId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  jobType?: string[];
  location?: string;
  keywords?: string;
  sortBy?: "date" | "engagement" | "relevance";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
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
