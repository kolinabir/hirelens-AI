# Contributing to HireLens

Thank you for your interest in contributing to HireLens! This document provides guidelines and information for contributors to help maintain code quality and ensure smooth collaboration.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (v5.0 or higher)
- **Git**

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/yourusername/hirelens.git
   cd hirelens
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Verify Setup**
   ```bash
   npm run build
   npm run test
   ```

## 📋 Project Structure

```
hirelens/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Landing page
├── components/            # React components
├── lib/                  # Utility libraries
│   ├── database.ts       # MongoDB utilities
│   ├── swagger.ts        # API documentation
│   └── mailer.ts         # Email services
├── types/                # TypeScript definitions
├── scripts/              # Automation scripts
└── docs/                 # Documentation
```

## 🛠️ Development Guidelines

### Code Style

We use **ESLint** and **Prettier** for code formatting:

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript Standards

- **Strict Mode**: All code must pass TypeScript strict checks
- **Type Safety**: Avoid `any` types; use proper interfaces
- **Naming**: Use PascalCase for components, camelCase for functions/variables

```typescript
// ✅ Good
interface JobPost {
  _id: string;
  jobTitle: string;
  company: string;
  isProcessed: boolean;
}

// ❌ Avoid
const data: any = response.data;
```

### Component Guidelines

- **Functional Components**: Use React functional components with hooks
- **Props Interface**: Define clear prop interfaces
- **Error Boundaries**: Handle errors gracefully

```tsx
// ✅ Good Component Structure
interface JobCardProps {
  job: JobPost;
  onSelect: (id: string) => void;
}

export function JobCard({ job, onSelect }: JobCardProps) {
  const handleClick = () => onSelect(job._id);

  return (
    <div className="job-card" onClick={handleClick}>
      <h3>{job.jobTitle}</h3>
      <p>{job.company}</p>
    </div>
  );
}
```

### API Development

- **RESTful Design**: Follow REST conventions
- **Error Handling**: Use consistent error responses
- **Validation**: Validate all inputs
- **Documentation**: Update Swagger specs for new endpoints

```typescript
// ✅ Good API Route Structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    // Business logic
    const result = await createSubscriber(body.email);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Subscriber created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🔄 Contribution Workflow

### 1. Issue First

- **Check Existing Issues**: Search for existing issues before creating new ones
- **Issue Templates**: Use provided templates for bugs/features
- **Discussion**: Discuss major changes in issues before implementing

### 2. Branch Strategy

```bash
# Feature branches
git checkout -b feature/job-filtering-enhancement

# Bug fixes
git checkout -b fix/dashboard-stats-calculation

# Documentation
git checkout -b docs/api-documentation-update
```

### 3. Commit Messages

Follow **Conventional Commits** format:

```bash
# Features
git commit -m "feat(jobs): add advanced filtering with salary range"

# Bug fixes
git commit -m "fix(dashboard): correct job count calculation"

# Documentation
git commit -m "docs(api): update swagger documentation for jobs endpoint"

# Refactoring
git commit -m "refactor(components): extract reusable JobCard component"
```

### 4. Pull Request Process

1. **Create PR**: Use the provided PR template
2. **Description**: Clearly describe changes and motivation
3. **Testing**: Ensure all tests pass
4. **Documentation**: Update relevant documentation
5. **Review**: Address feedback promptly

#### PR Template Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated for changes
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] API changes include Swagger updates

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
// ✅ Good Test Example
describe("JobsAPI", () => {
  describe("GET /api/jobs", () => {
    it("should return paginated jobs with default parameters", async () => {
      const response = await fetch("/api/jobs");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("pagination");
      expect(Array.isArray(data.data.jobs)).toBe(true);
    });

    it("should filter jobs by keywords", async () => {
      const response = await fetch("/api/jobs?keywords=react");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.data.jobs.every((job) =>
          job.content.toLowerCase().includes("react")
        )
      ).toBe(true);
    });
  });
});
```

## 📚 Documentation

### API Documentation

- **Swagger**: Update `/lib/swagger.ts` for new endpoints
- **Examples**: Include request/response examples
- **Error Codes**: Document all possible error responses

### Code Documentation

```typescript
/**
 * Processes job posts using AI extraction
 * @param jobId - MongoDB ObjectId of the job to process
 * @param options - Processing configuration options
 * @returns Promise resolving to processed job data
 * @throws {ValidationError} When jobId is invalid
 * @throws {ProcessingError} When AI processing fails
 */
export async function processJobPost(
  jobId: string,
  options: ProcessingOptions = {}
): Promise<ProcessedJobData> {
  // Implementation
}
```

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**

- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 118]
- Node.js: [e.g., v18.17.0]

**Screenshots**
If applicable, add screenshots

**Additional Context**
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Summary**
Brief description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Detailed description of the proposed feature

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Mockups, examples, or references
```

## 🔒 Security

### Security Guidelines

- **Environment Variables**: Never commit sensitive data
- **Input Validation**: Sanitize all user inputs
- **Authentication**: Follow secure authentication practices
- **Dependencies**: Keep dependencies updated

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email: security@hirelens.com
2. Include: Detailed description and steps to reproduce
3. Wait: For acknowledgment before public disclosure

## 📦 Release Process

### Version Numbering

We follow **Semantic Versioning** (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Deployment successful

## 🤝 Community Guidelines

### Code of Conduct

- **Be Respectful**: Treat everyone with respect
- **Be Inclusive**: Welcome contributors from all backgrounds
- **Be Constructive**: Provide helpful feedback
- **Be Patient**: Remember everyone is learning

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: security@hirelens.com (security issues only)

## 🏷️ Labels and Tags

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority issue
- `priority: low` - Low priority issue

### Component Labels

- `api` - Backend API changes
- `ui` - Frontend UI changes
- `database` - Database related
- `scraping` - Web scraping functionality
- `email` - Email system changes
- `ai` - AI/ML processing changes

## 📈 Performance Guidelines

### Frontend Performance

- **Bundle Size**: Keep bundle size minimal
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching strategies

### Backend Performance

- **Database Queries**: Optimize MongoDB queries
- **Indexing**: Ensure proper database indexing
- **Caching**: Use Redis for frequently accessed data
- **Rate Limiting**: Implement API rate limiting

## 🔧 Tools and Resources

### Development Tools

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - TypeScript Importer
  - Tailwind CSS IntelliSense

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

By contributing to HireLens, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Recognition

Contributors will be recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor graphs and statistics

---

## Quick Start Checklist

- [ ] Fork the repository
- [ ] Set up development environment
- [ ] Read through codebase structure
- [ ] Pick a "good first issue"
- [ ] Create feature branch
- [ ] Make changes following guidelines
- [ ] Add tests for new functionality
- [ ] Update documentation
- [ ] Submit pull request
- [ ] Address review feedback

**Happy Contributing! 🎉**

For questions, feel free to open a GitHub Discussion or reach out to the maintainers.
