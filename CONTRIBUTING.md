# Contributing to PlanetTogether Manufacturing SCM + APS

Thank you for your interest in contributing to PlanetTogether! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up environment variables: `cp .env.example .env`
5. Configure your local database in `.env`
6. Push database schema: `npm run db:push`
7. Seed the database: `npm run db:seed`
8. Start development server: `npm run dev`

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Test your changes thoroughly
4. Commit with descriptive messages
5. Push to your fork
6. Create a Pull Request

## 🏗️ Architecture Overview

### Frontend (Client)
- **React + TypeScript**: Modern React with full TypeScript support
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **React Flow**: For schema visualization
- **React Query**: Data fetching and caching

### Backend (Server)
- **Express + TypeScript**: RESTful API server
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database
- **Authentication**: Session-based auth with Passport.js

### Database
- **PostgreSQL**: Relational database for complex manufacturing data
- **Drizzle**: Type-safe ORM with schema migrations
- **Schema Design**: Follows manufacturing ERP best practices

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── db.ts              # Database connection
│   └── seed.ts            # Sample data seeding
├── shared/                 # Shared code
│   └── schema.ts           # Database schema definitions
└── docs/                   # Documentation
```

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add comments for complex business logic

### Database Changes
- Always use Drizzle schema definitions in `shared/schema.ts`
- Create proper relationships between tables
- Add appropriate indexes for performance
- Test migrations thoroughly

### Frontend Components
- Use functional components with hooks
- Implement proper error handling
- Make components responsive (mobile-first)
- Use TypeScript interfaces for props

### API Design
- Follow RESTful conventions
- Use appropriate HTTP status codes
- Validate input data with Zod schemas
- Handle errors gracefully

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Testing Guidelines
- Write unit tests for utility functions
- Test API endpoints thoroughly
- Include integration tests for critical workflows
- Test responsive design on multiple devices

## 📝 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(schema): add recipe management system
fix(api): resolve authentication timeout issue
docs(readme): update installation instructions
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Console errors (if any)

## 💡 Feature Requests

For feature requests:
- Describe the problem you're trying to solve
- Explain the proposed solution
- Consider implementation complexity
- Discuss potential alternatives

## 🔍 Code Review Process

1. All changes require review before merging
2. Reviewers will check:
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Performance implications
3. Address review feedback promptly
4. Ensure CI/CD checks pass

## 📊 Database Schema Contributions

When contributing to database schema:
- Follow manufacturing ERP best practices
- Consider scalability and performance
- Maintain referential integrity
- Update documentation for new tables/fields
- Test with realistic data volumes

## 🏭 Manufacturing Domain Knowledge

This project focuses on manufacturing ERP systems. Contributors should understand:
- Manufacturing processes (discrete vs process)
- Production planning concepts
- Inventory management principles
- Quality control workflows
- Resource planning and scheduling

## 🚀 Deployment

### Development Deployment
- Replit: Automatic deployment on push
- Local: `npm run build && npm start`

### Production Considerations
- Environment variable configuration
- Database migration strategy
- Performance optimization
- Security considerations

## 📖 Documentation

### Required Documentation
- Update README.md for new features
- Document new API endpoints
- Add inline code comments
- Update schema documentation

### Documentation Style
- Use clear, concise language
- Include code examples
- Provide context and rationale
- Keep documentation up-to-date

## 🆘 Getting Help

- Create an issue for questions
- Check existing documentation
- Review the codebase for examples
- Join community discussions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PlanetTogether Manufacturing SCM + APS! 🏭