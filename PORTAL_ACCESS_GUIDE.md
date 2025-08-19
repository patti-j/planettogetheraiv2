# External Partners Portal - Access Guide

## Quick Access Steps

### 1. Portal URL
The external partners portal is accessible at:
```
http://localhost:5000/portal
```

### 2. Current Status
The portal foundation is built with:
- ✅ Database schema for external users/companies
- ✅ JWT authentication system
- ✅ Login/Registration pages
- ✅ Supplier dashboard interface
- ⚠️ Storage methods need to be connected to database

## How to Set Up Portal Access

### Option 1: Quick Test Access (Recommended for Testing)

1. **Create a test company and user directly in the database:**

```sql
-- Run this SQL in your database to create a test supplier company and user
-- Password will be: Test123!

-- Create a test supplier company
INSERT INTO external_companies (
  id,
  name,
  type,
  status,
  ai_onboarding_complete,
  created_at
) VALUES (
  gen_random_uuid(),
  'Acme Suppliers Inc',
  'supplier',
  'active',
  true,
  NOW()
) RETURNING id;

-- Create a test user (use the company ID from above)
-- Password hash is for 'Test123!'
INSERT INTO external_users (
  id,
  email,
  password_hash,
  company_id,
  first_name,
  last_name,
  role,
  email_verified,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'supplier@acme.com',
  '$2a$10$YourHashedPasswordHere', -- This needs bcrypt hash
  'YOUR_COMPANY_ID_FROM_ABOVE',
  'John',
  'Doe',
  'admin',
  true,
  true,
  NOW()
);
```

2. **Access the portal:**
   - Navigate to: `http://localhost:5000/portal/login`
   - Login with:
     - Email: `supplier@acme.com`
     - Password: `Test123!`

### Option 2: Use Registration Flow

1. **Company Registration:**
   - Go to: `http://localhost:5000/portal/register`
   - Fill in company details
   - Submit registration (creates pending company)

2. **Approve Company (Admin Task):**
   ```sql
   -- Update company status to active
   UPDATE external_companies 
   SET status = 'active' 
   WHERE name = 'Your Company Name';
   ```

3. **User Registration:**
   - Company sends invite code to users
   - Users register with invite code
   - Verify email and login

### Option 3: API Registration (For Testing)

```bash
# Register a new company
curl -X POST http://localhost:5000/api/portal/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier Co",
    "type": "supplier",
    "industry": "manufacturing",
    "size": "medium",
    "country": "USA",
    "city": "New York"
  }'

# Login (after company is activated)
curl -X POST http://localhost:5000/api/portal/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@testsupplier.com",
    "password": "YourPassword123"
  }'
```

## Portal Features by User Type

### Supplier Portal (`/portal/supplier`)
- Purchase order management
- Delivery tracking
- Quality document uploads
- Performance metrics dashboard
- AI assistant for help

### Customer Portal (`/portal/customer`)
- Order placement and tracking
- Inventory visibility
- Delivery schedules
- Invoice management

### OEM Portal (`/portal/oem`)
- Demand forecasting
- Production visibility
- Quality metrics
- Supply chain analytics

## Troubleshooting

### Common Issues:

1. **"Cannot find module" errors:**
   - The portal components are created but may need routing updates
   - Check that portal files exist in `/portal` directory

2. **"Invalid credentials" on login:**
   - Verify the user exists in `external_users` table
   - Check that company status is 'active'
   - Ensure email is verified (`email_verified = true`)

3. **"Company not active" error:**
   - Update company status in database:
   ```sql
   UPDATE external_companies SET status = 'active' WHERE id = 'company_id';
   ```

4. **Password hashing issue:**
   - Use bcrypt to hash passwords:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('Test123!', 10);
   console.log(hash); // Use this hash in database
   ```

## Development Testing

For quick development testing, you can bypass authentication temporarily:

1. **Create a development token:**
```javascript
// In browser console or Node.js
const token = 'Bearer dev_token_' + Date.now();
localStorage.setItem('portal_token', token);
```

2. **Mock user session:**
```javascript
localStorage.setItem('portal_user', JSON.stringify({
  id: 'test-user-1',
  email: 'test@supplier.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin'
}));

localStorage.setItem('portal_company', JSON.stringify({
  id: 'test-company-1',
  name: 'Test Supplier',
  type: 'supplier',
  aiOnboardingComplete: true
}));
```

## Next Steps

1. **Complete Storage Integration:**
   - Add portal methods to `server/storage.ts`
   - Connect to existing database

2. **Test Authentication Flow:**
   - Verify JWT token generation
   - Test login/logout cycle

3. **Customize Portal Features:**
   - Add specific business logic
   - Integrate with main ERP system

4. **Deploy to Production:**
   - Set environment variables
   - Configure production database
   - Enable SSL/TLS

## Environment Variables Needed

Add these to your `.env` file:
```env
# Portal Configuration
PORTAL_JWT_SECRET=your-secret-key-change-in-production
PORTAL_SESSION_TIMEOUT=3600
PORTAL_URL=http://localhost:5000/portal

# Email Configuration (for invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Contact Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs for API errors
3. Verify database connections
4. Ensure all dependencies are installed

The portal is designed to be self-service once configured, allowing partners to manage their own accounts and interactions with your ERP system.