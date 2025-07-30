# Deployment Checklist

## Pre-Deployment Preparation

### ✅ Environment Variables Setup
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `OPENAI_API_KEY` - Required for AI features (Max assistant, optimization)
- [ ] `SESSION_SECRET` - Secure random string (32+ characters minimum)
- [ ] `NODE_ENV=production` - Enable production optimizations
- [ ] `FRONTEND_URL` - Your custom domain (optional)

### ✅ Database Preparation
- [ ] Database is created and accessible
- [ ] Run `npm run db:push` to create tables
- [ ] Database has sufficient storage and connection limits
- [ ] Backup and recovery procedures are in place

### ✅ Security Configuration
- [ ] Strong session secret configured
- [ ] HTTPS enabled (handled by Replit automatically)
- [ ] CORS settings configured for production domain
- [ ] Rate limiting considerations (if needed)

### ✅ Performance Optimization
- [ ] Production build tested locally (`npm run build && npm start`)
- [ ] Static assets are properly served
- [ ] Database indexes are in place
- [ ] Connection pooling configured

## Replit Deployment Steps

### 1. Deploy Button
- [ ] Click the "Deploy" button in your Replit workspace
- [ ] Choose deployment type:
  - **Autoscale** (Recommended): Scales automatically, pay-per-use
  - **Reserved VM**: Dedicated resources, always-on
  - **Static**: For frontend-only deployments (not applicable here)

### 2. Configure Secrets
In Replit Secrets, add:
```
DATABASE_URL=postgresql://[provided-by-replit]
OPENAI_API_KEY=your-openai-api-key
SESSION_SECRET=your-secure-32-char-minimum-secret
NODE_ENV=production
```

### 3. Domain Configuration
- [ ] Note your deployment URL: `https://your-app-name.replit.app`
- [ ] Configure custom domain redirect (if needed)
- [ ] Test deployment URL functionality

### 4. Post-Deployment Testing
- [ ] Application loads correctly
- [ ] Database connection works
- [ ] User authentication functions
- [ ] AI features (Max assistant) work with OpenAI API
- [ ] Excel export functionality works
- [ ] All major features tested

## Production Monitoring

### Health Checks
- [ ] Monitor application startup logs
- [ ] Check database connection status
- [ ] Verify API response times
- [ ] Monitor error rates

### Performance Metrics
- [ ] Database query performance
- [ ] Memory usage
- [ ] Response times for key operations
- [ ] User authentication success rates

## Troubleshooting Common Issues

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check database server availability
- Ensure database user has proper permissions

### Authentication Problems
- Verify `SESSION_SECRET` is set and secure
- Check cookie settings for production domain
- Ensure HTTPS is properly configured

### AI Features Not Working
- Verify `OPENAI_API_KEY` is correctly set
- Check OpenAI API quota and usage limits
- Monitor API response times and errors

### Static Assets Not Loading
- Verify build process completed successfully
- Check static file serving configuration
- Ensure proper asset paths in production

## Success Criteria

Your deployment is successful when:
- [ ] Application loads at deployment URL
- [ ] Users can register and login
- [ ] Database operations work correctly
- [ ] Max AI assistant responds to queries
- [ ] Excel export downloads properly
- [ ] All major manufacturing features function
- [ ] Performance is acceptable for expected load

## Domain Redirect Setup

When you have your deployment URL (e.g., `https://manufacturing-erp-xyz.replit.app`), you can:

1. **Domain Forwarding**: Set up domain forwarding/redirect to your `.replit.app` URL
2. **DNS CNAME**: Point your domain's CNAME record to your Replit deployment
3. **Custom Domain**: Use Replit's custom domain feature (if available in your plan)

Your redirect URL will be: `https://[your-unique-subdomain].replit.app`