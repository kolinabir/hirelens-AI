import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HireLens API Documentation',
      version: '2.0.0',
      description: 'AI-Powered Job Discovery Platform API - Comprehensive documentation for all endpoints',
      contact: {
        name: 'HireLens Support',
        email: 'support@hirelens.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://hirelens.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        JobPost: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
              example: '507f1f77bcf86cd799439011',
            },
            postId: {
              type: 'string',
              description: 'Facebook post ID',
              example: 'pfbid0ReYPv9ztbhFVxAsgeTVUzVwKwJDKQANWu2vJiyBLafqoFFmsito6qHSEfomQA4qXl',
            },
            jobTitle: {
              type: 'string',
              description: 'Job title extracted from post',
              example: 'Senior React Developer',
            },
            company: {
              type: 'string',
              description: 'Company name',
              example: 'TechCorp Inc.',
            },
            location: {
              type: 'string',
              description: 'Job location',
              example: 'Dhaka, Bangladesh',
            },
            salary: {
              type: 'string',
              description: 'Salary information',
              example: '50,000 - 80,000 BDT',
            },
            employmentType: {
              type: 'string',
              description: 'Type of employment',
              example: 'full-time',
            },
            technicalSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Required technical skills',
              example: ['React', 'Node.js', 'TypeScript'],
            },
            content: {
              type: 'string',
              description: 'Original post content',
            },
            scrapedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the job was scraped',
            },
            isProcessed: {
              type: 'boolean',
              description: 'Whether the job has been processed by AI',
              example: true,
            },
            isDuplicate: {
              type: 'boolean',
              description: 'Whether the job is marked as duplicate',
              example: false,
            },
          },
        },
        FacebookGroup: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
            },
            groupId: {
              type: 'string',
              description: 'Facebook group ID',
              example: 'CSEJobBangladesh',
            },
            name: {
              type: 'string',
              description: 'Group name',
              example: 'Facebook Group CSE Job Bangladesh',
            },
            url: {
              type: 'string',
              description: 'Facebook group URL',
              example: 'https://www.facebook.com/groups/CSEJobBangladesh',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the group is actively being scraped',
              example: true,
            },
            memberCount: {
              type: 'number',
              description: 'Number of group members',
              example: 125000,
            },
            totalPostsScraped: {
              type: 'number',
              description: 'Total posts scraped from this group',
              example: 1250,
            },
            lastScraped: {
              type: 'string',
              format: 'date-time',
              description: 'Last time the group was scraped',
            },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalJobs: {
              type: 'number',
              description: 'Total number of jobs',
              example: 70,
            },
            todayJobs: {
              type: 'number',
              description: 'Jobs scraped today',
              example: 15,
            },
            processedJobs: {
              type: 'number',
              description: 'Jobs processed by AI',
              example: 64,
            },
            unprocessedJobs: {
              type: 'number',
              description: 'Jobs not yet processed',
              example: 6,
            },
            structuredJobs: {
              type: 'number',
              description: 'Jobs with structured data',
              example: 60,
            },
            activeGroups: {
              type: 'number',
              description: 'Number of active groups',
              example: 4,
            },
            successRate: {
              type: 'number',
              description: 'Processing success rate percentage',
              example: 91,
            },
            lastUpdate: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        EmailSubscriber: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Subscriber email address',
              example: 'user@example.com',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether subscription is active',
              example: true,
            },
            subscribedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription date',
            },
            sentJobIds: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'IDs of jobs already sent to this subscriber',
            },
          },
        },
        TrackedWebsite: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId',
            },
            url: {
              type: 'string',
              description: 'Website URL to track',
              example: 'https://careers.company.com',
            },
            name: {
              type: 'string',
              description: 'Website display name',
              example: 'Company Careers',
            },
            companyName: {
              type: 'string',
              description: 'Company name',
              example: 'TechCorp',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether tracking is active',
              example: true,
            },
            lastScraped: {
              type: 'string',
              format: 'date-time',
              description: 'Last scraping time',
            },
            lastJobCount: {
              type: 'number',
              description: 'Number of jobs found in last scrape',
              example: 25,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message if request failed',
            },
            message: {
              type: 'string',
              description: 'Additional message',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/JobPost',
              },
              description: 'Array of items',
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Current page number',
                  example: 1,
                },
                limit: {
                  type: 'number',
                  description: 'Items per page',
                  example: 20,
                },
                total: {
                  type: 'number',
                  description: 'Total number of items',
                  example: 100,
                },
                totalPages: {
                  type: 'number',
                  description: 'Total number of pages',
                  example: 5,
                },
                hasNext: {
                  type: 'boolean',
                  description: 'Whether there is a next page',
                  example: true,
                },
                hasPrev: {
                  type: 'boolean',
                  description: 'Whether there is a previous page',
                  example: false,
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        KeywordsParam: {
          name: 'keywords',
          in: 'query',
          description: 'Search keywords',
          required: false,
          schema: {
            type: 'string',
          },
        },
        LocationParam: {
          name: 'location',
          in: 'query',
          description: 'Job location filter',
          required: false,
          schema: {
            type: 'string',
          },
        },
        CompanyParam: {
          name: 'company',
          in: 'query',
          description: 'Company name filter',
          required: false,
          schema: {
            type: 'string',
          },
        },
        SkillsParam: {
          name: 'skills',
          in: 'query',
          description: 'Required skills (comma-separated)',
          required: false,
          schema: {
            type: 'string',
          },
        },
      },
    },
    tags: [
      {
        name: 'Jobs',
        description: 'Job management operations',
      },
      {
        name: 'Groups',
        description: 'Facebook group management',
      },
      {
        name: 'Dashboard',
        description: 'Dashboard and analytics',
      },
      {
        name: 'Email',
        description: 'Email and notification services',
      },
      {
        name: 'Websites',
        description: 'Website tracking and monitoring',
      },
      {
        name: 'Scraping',
        description: 'Scraping control and management',
      },
    ],
  },
  apis: ['./app/api/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);
