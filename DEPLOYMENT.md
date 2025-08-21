# Deployment Guide

This guide covers various deployment options for the PlanetTogether Manufacturing SCM + APS system.

## 🚀 Quick Deploy Options

### Replit (Recommended for Development)
1. Fork or import the repository to Replit
2. Configure environment variables in Replit Secrets:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `SESSION_SECRET`
3. Replit will automatically deploy the application

### Railway
1. Connect your GitHub repository to Railway
2. Add environment variables
3. Deploy automatically on push

### Vercel (Frontend) + Railway (Backend)
Split deployment for better performance:
- Deploy frontend to Vercel
- Deploy backend to Railway
- Configure CORS settings

## 🏗️ Self-Hosted Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- SSL certificate (for production)
- Domain name (optional)

### Production Build
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Environment Configuration
Create `.env` file with production values:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AI Integration
OPENAI_API_KEY=your_production_openai_key

# Security
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret_32_chars_minimum

# Optional: Email notifications
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_email_password
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/manufacturing_erp
      - SESSION_SECRET=your_session_secret
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=manufacturing_erp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### Using AWS Elastic Beanstalk
1. Create Elastic Beanstalk application
2. Configure environment variables
3. Upload application zip
4. Configure RDS PostgreSQL instance

#### Using AWS ECS
1. Create container definitions
2. Set up Application Load Balancer
3. Configure RDS database
4. Deploy using ECS service

### Google Cloud Platform

#### Using Google App Engine
1. Create `app.yaml` configuration
2. Configure Cloud SQL PostgreSQL
3. Deploy with `gcloud app deploy`

#### Using Google Cloud Run
1. Build container image
2. Push to Container Registry
3. Deploy to Cloud Run
4. Connect to Cloud SQL

### Microsoft Azure

#### Using Azure App Service
1. Create App Service instance
2. Configure Azure Database for PostgreSQL
3. Set application settings
4. Deploy from GitHub

## 🗄️ Database Setup

### PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE manufacturing_erp;

-- Create user (optional)
CREATE USER erp_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE manufacturing_erp TO erp_user;
```

### Database Migration
```bash
# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### Database Backups
```bash
# Create backup
pg_dump manufacturing_erp > backup.sql

# Restore backup
psql manufacturing_erp < backup.sql
```

## 🔒 Security Configuration

### SSL/TLS Setup
For production deployment, configure SSL:
- Use Let's Encrypt for free SSL certificates
- Configure reverse proxy (nginx/Apache)
- Enable HTTPS redirects

### Environment Security
- Use strong session secrets (32+ characters)
- Enable database SSL connections
- Restrict database access by IP
- Use environment variables for secrets

### CORS Configuration
Configure CORS for production:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true
}));
```

## 📊 Performance Optimization

### Database Optimization
- Enable connection pooling
- Add database indexes
- Monitor query performance
- Set up read replicas for scaling

### Application Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Monitor application performance

### Frontend Optimization
- Enable code splitting
- Optimize bundle size
- Use service workers
- Implement progressive loading

## 📈 Monitoring and Logging

### Application Monitoring
- Set up error tracking (Sentry)
- Monitor application metrics
- Configure health checks
- Set up alerting

### Database Monitoring
- Monitor connection counts
- Track query performance
- Set up backup monitoring
- Monitor disk usage

### Log Management
```javascript
// Configure structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to production
      run: |
        # Add your deployment commands here
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
- Check DATABASE_URL format
- Verify database server is running
- Confirm network connectivity
- Check SSL requirements

#### Build Failures
- Verify Node.js version compatibility
- Check for missing dependencies
- Review build logs for errors
- Ensure environment variables are set

#### Performance Issues
- Monitor database query performance
- Check memory usage
- Review application logs
- Optimize database indexes

### Health Checks
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 📋 Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Team training completed

## 🆘 Support

For deployment support:
- Check the troubleshooting section
- Review application logs
- Contact the development team
- Create an issue on GitHub

---

Happy deploying! 🚀