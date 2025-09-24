# HireLens - AI-Powered Job Discovery Platform

An intelligent job discovery platform that combines automated Facebook job scraping with AI-powered processing and professional presentation. Built with Next.js, MongoDB, and advanced AI integration for comprehensive job market analysis.

## 🚀 Features

### Core Functionality

- **🤖 AI-Powered Job Processing**: Advanced AI extraction of job details, requirements, and structured data
- **📱 Smart Facebook Scraping**: Automated scraping with anti-detection mechanisms
- **🎯 Intelligent Filtering**: Advanced search and filtering with multiple criteria (skills, location, company, salary)
- **📊 Real-time Analytics**: Live dashboard with accurate statistics and success rates
- **🔄 Duplicate Management**: Automatic duplicate detection and cleanup tools

### User Interface

- **🎨 Professional Dashboard**: Modern, responsive UI with HireLens branding
- **📈 Visual Statistics**: Real-time charts and metrics for job processing
- **🔍 Advanced Search**: Multi-criteria filtering with smart suggestions
- **📋 Job Management**: Comprehensive job listing with detailed views and processing tools
- **⚙️ Group Management**: Visual group cards with statistics and status indicators

### Data Management

- **🗃️ MongoDB Integration**: Robust data storage with advanced indexing
- **🔄 Data Consistency**: Synchronized statistics across all endpoints
- **📧 Email Integration**: Automated job digest emails with subscriber management
- **🌐 Website Tracking**: Monitor job postings from company websites
- **🧹 Data Cleanup**: Built-in tools for maintaining data quality

### Technical Features

- **🚀 API-First Architecture**: RESTful APIs for all operations
- **⚡ Performance Optimized**: Fast loading with efficient queries
- **🔐 Secure Processing**: Safe credential management and data handling
- **📱 Mobile Responsive**: Works seamlessly on all devices
- **🎛️ Manual Processing**: Tools for reviewing and processing individual jobs

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Facebook account credentials
- Basic knowledge of web scraping ethics

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd job-scarap
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your credentials:

   ```env
   # Facebook Credentials
   FACEBOOK_EMAIL=your-email@example.com
   FACEBOOK_PASSWORD=your-password

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/job-scraper
   MONGODB_DB_NAME=job_scraper

   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@hirelens.com

   # AI Processing (Optional)
   OPENAI_API_KEY=your-openai-api-key
   SMYTH_AI_API_KEY=your-smyth-ai-key

   # Application Settings
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas cloud service
   ```

5. **Run the application**

   ```bash
   npm run dev
   ```

6. **Access the dashboard**
   Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 📚 API Endpoints

### Jobs Management

- `GET /api/jobs` - List jobs with advanced filtering (keywords, location, company, skills, salary, work type)
- `POST /api/jobs/process-manual` - Process individual jobs with AI
- `POST /api/jobs/cleanup-duplicates` - Remove duplicate job posts
- `DELETE /api/jobs/clear` - Clear unstructured or all jobs
- `POST /api/jobs/extract` - Extract job data using AI
- `POST /api/jobs/reprocess` - Reprocess existing jobs

### Groups Management

- `GET /api/groups` - List all Facebook groups with statistics
- `POST /api/groups` - Add new Facebook groups
- `PUT /api/groups/[id]` - Update group settings
- `DELETE /api/groups/[id]` - Remove Facebook groups

### Dashboard & Analytics

- `GET /api/dashboard/stats` - Real-time dashboard statistics
- `GET /api/debug/jobs-count` - Detailed job count information

### Email & Notifications

- `POST /api/email/send-hourly` - Send hourly job digest
- `POST /api/email/send-manual` - Send manual job digest
- `POST /api/email/test` - Test email functionality
- `GET /api/subscribers` - Manage email subscribers
- `POST /api/subscribers` - Add new subscribers

### Website Tracking

- `GET /api/websites` - List tracked websites
- `POST /api/websites` - Add new website to track
- `POST /api/websites/scrape` - Scrape jobs from websites
- `GET /api/websites/snapshots` - Get website snapshots
- `POST /api/websites/cleanup-duplicates` - Clean duplicate snapshots
- `POST /api/websites/schedule-daily` - Schedule daily website scraping

### Scraping Control

- `POST /api/scraping/manual` - Start manual scraping session
- `POST /api/scraping/auto` - Start automated scraping
- `GET /api/scraping/status` - Check scraping status
- `POST /api/scraping/abort` - Abort current scraping session
- `POST /api/scraping/trigger` - Trigger scraping process
- `POST /api/scraping/process` - Process scraped data

## 🔧 Configuration

### Browser Settings

The application uses Puppeteer with optimized settings for Facebook scraping:

- Custom user agent and viewport
- Request interception for faster loading
- Proxy support (optional)

### Rate Limiting

Built-in rate limiting to avoid detection:

- 1 second delay between requests
- Random delays for human-like behavior
- Maximum 1 concurrent scraping session

### Data Processing

- Automatic duplicate detection
- Job keyword extraction
- Engagement metrics tracking
- Content validation and cleanup

## 📊 Dashboard Features

### Main Dashboard (`/dashboard`)

- **📈 Real-time Statistics**: Live job counts, processing rates, and success metrics
- **🎯 Quick Actions**: Direct access to scraping, processing, and email tools
- **📱 HireLens Branding**: Professional interface with custom logo and modern design
- **⚡ Performance Metrics**: Active groups, processed jobs, and system health indicators

### Jobs Management (`/dashboard/jobs`)

- **🔍 Advanced Filtering**: Search by keywords, location, company, job type, salary range, work type, and skills
- **📋 Smart Job Cards**: Rich job displays with engagement metrics, application methods, and structured data
- **🎛️ Bulk Operations**: Clear unstructured jobs, process multiple jobs, and manage job lifecycle
- **📄 Pagination**: Efficient browsing through large job datasets
- **🔄 Real-time Updates**: Live job counts and filtering results

### Groups Management (`/dashboard/groups`)

- **📊 Visual Group Cards**: Beautiful cards showing group statistics, member counts, and scraping history
- **📈 Progress Tracking**: Visual indicators for posts scraped, last scraping time, and group activity
- **⚙️ Group Controls**: Add, edit, activate/deactivate, and delete Facebook groups
- **🎨 Status Indicators**: Real-time status with color-coded activity levels
- **📱 Responsive Design**: Optimized for desktop and mobile viewing

### Manual Processing (`/dashboard/process`)

- **🤖 AI-Powered Processing**: Individual job review and AI-enhanced data extraction
- **🧹 Duplicate Cleanup**: Built-in duplicate removal tools with confirmation dialogs
- **📊 Processing Statistics**: Track processed, remaining, and deleted job counts
- **🎯 Quality Control**: Manual review and approval workflow for job data

### Email Management (`/dashboard/mail`)

- **📧 Subscriber Management**: Add, view, and manage email subscribers
- **📨 Digest Controls**: Send hourly, manual, and test email digests
- **📊 Email Statistics**: Track subscriber counts and email delivery status
- **🎛️ Email Templates**: Professional job digest formatting with structured data

### Website Tracking (`/dashboard/websites`)

- **🌐 Website Monitoring**: Track job postings from company career pages
- **📊 Snapshot Management**: Historical tracking of job posting changes
- **🔄 Automated Scraping**: Scheduled daily scraping of tracked websites
- **📈 Analytics**: Job count trends and new posting notifications

## 🆕 Recent Updates & Improvements

### Version 2.0 - AI-Enhanced Job Discovery

- **🎨 Brand Refresh**: Updated to HireLens branding with professional logo and modern UI
- **🤖 AI Integration**: Advanced job processing with intelligent data extraction
- **📊 Accurate Analytics**: Fixed dashboard statistics to show real-time, accurate data
- **🔍 Smart Filtering**: Enhanced job filtering with multiple criteria and real-time results
- **🧹 Data Quality**: Implemented duplicate detection and cleanup tools
- **📧 Email System**: Comprehensive email digest system with subscriber management
- **🌐 Website Tracking**: Added ability to monitor job postings from company websites
- **⚡ Performance**: Optimized queries and improved loading speeds
- **🔧 Bug Fixes**: Resolved React key conflicts, filter synchronization, and build errors

### Key Technical Improvements

- **Database Consistency**: Synchronized filtering logic across all APIs
- **Type Safety**: Enhanced TypeScript implementation with proper type definitions
- **Error Handling**: Improved error handling and user feedback
- **Mobile Optimization**: Responsive design improvements for all screen sizes
- **API Standardization**: Consistent API responses and error handling
- **Security Enhancements**: Better credential management and data validation

## ⚠️ Important Notes

### Legal Considerations

- **Terms of Service**: Facebook's ToS may prohibit automated scraping
- **Rate Limiting**: Respect Facebook's servers and implement proper delays
- **Data Usage**: Only scrape data you have permission to access
- **Privacy**: Handle personal data responsibly

### Technical Limitations

- Two-factor authentication requires manual intervention
- Private groups may need manual approval
- Account may get blocked if detected by Facebook
- Checkpoint challenges need manual resolution

### Security

- Store credentials securely (consider encryption)
- Use environment variables for sensitive data
- Implement proper access controls
- Regular security audits

## 🚀 Production Deployment

1. **Environment Variables**

   ```bash
   NODE_ENV=production
   PUPPETEER_HEADLESS=true
   ```

2. **Database Optimization**

   - Enable MongoDB indexes
   - Configure connection pooling
   - Set up backups

3. **Monitoring**
   - Log rotation
   - Error tracking
   - Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational purposes only. Please respect Facebook's Terms of Service and applicable laws.

## 🆘 Support

For questions and support:

1. Check the logs in `/logs/app.log`
2. Review environment configuration
3. Ensure MongoDB is running
4. Verify Facebook credentials

## 🎯 Use Cases

- **Job Seekers**: Discover opportunities from multiple Facebook groups in one place
- **Recruiters**: Monitor job market trends and competitor postings
- **Researchers**: Analyze job market data and employment trends
- **Companies**: Track industry hiring patterns and salary benchmarks

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes, RESTful APIs
- **Database**: MongoDB with advanced indexing and aggregation
- **AI Integration**: OpenAI GPT, Smyth AI for job processing
- **Scraping**: Puppeteer, Apify for Facebook automation
- **Email**: SMTP integration for job digest delivery
- **Deployment**: Vercel, Docker support

---

**HireLens** - Transforming job discovery through AI-powered intelligence.

**Disclaimer**: This tool is for educational and research purposes only. Users are responsible for complying with Facebook's Terms of Service and applicable laws. Use responsibly and ethically.
