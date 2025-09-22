# Facebook Job Scraper

An automated Facebook job scraping application built with Next.js, Puppeteer, and MongoDB. This application allows you to scrape job posts from Facebook groups and manage them through a beautiful dashboard.

## 🚀 Features

- **Automated Facebook Login**: Secure login with credential management
- **Group Management**: Add and manage multiple Facebook groups
- **Intelligent Scraping**: Smart scrolling and post detection
- **Job Post Extraction**: Extract job details, engagement metrics, and metadata
- **Dashboard Interface**: Beautiful UI to view and manage scraped jobs
- **API-First Architecture**: RESTful APIs for all operations
- **MongoDB Integration**: Robust data storage with indexing
- **Real-time Monitoring**: Track scraping sessions and progress

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

### Jobs

- `GET /api/jobs` - List all scraped jobs with filtering
- `DELETE /api/jobs?id={postId}` - Delete a specific job post

### Groups

- `GET /api/groups` - List all Facebook groups
- `POST /api/groups` - Add new Facebook groups

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

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

- Overview statistics
- System status monitoring
- Quick action buttons

### Jobs Page (`/dashboard/jobs`)

- View all scraped job posts
- Advanced filtering and sorting
- Pagination support
- Delete unwanted posts

### Groups Management

- Add Facebook group URLs
- Monitor group status
- Track scraping statistics

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

---

**Disclaimer**: This tool is for educational and research purposes only. Users are responsible for complying with Facebook's Terms of Service and applicable laws. Use responsibly and ethically.
