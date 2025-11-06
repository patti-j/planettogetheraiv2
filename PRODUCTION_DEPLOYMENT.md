# Production Deployment Guide

## User Access Setup for Production

This guide ensures that key administrators (Patti and Jim) have full access to all features in the production environment.

### Required Users with Full Access
- **patti** (patti@planettogether.com) - System Administrator
- **Jim** (jim@planettogether.com) - System Administrator

### Automatic Setup Script

After deploying to production, run the following command to ensure Patti and Jim have full Administrator access:

```bash
# Option 1: Using the shell script (recommended)
./scripts/database/setup-production-users.sh

# Option 2: Using a custom password
PRODUCTION_SETUP_KEY="YourSecurePassword123!" ./scripts/database/setup-production-users.sh

# Option 3: Direct TypeScript execution
NODE_ENV=production npx tsx scripts/database/ensure-production-users-access.ts
```

### What the Script Does

1. **Creates/Updates Administrator Role** - Ensures the Administrator role exists
2. **Grants All Permissions** - Assigns all 52 system permissions to the Administrator role
3. **Creates/Updates Users** - Ensures patti and Jim accounts exist with proper details
4. **Assigns Administrator Role** - Ensures both users have the Administrator role
5. **Verifies Access** - Confirms both users have full system access

### Manual Verification

To verify users have full access in production:

1. **Login Test**:
   - Username: `patti` or `Jim`
   - Password: (Use PRODUCTION_SETUP_KEY value or default)

2. **Access Verification**:
   - ✅ Dashboard access
   - ✅ Production Scheduler access
   - ✅ All admin features visible
   - ✅ Can manage other users
   - ✅ Can access all system settings

### Security Recommendations

1. **Change Default Passwords** - Immediately after first login
2. **Set Strong PRODUCTION_SETUP_KEY** - Use a secure password in production
3. **Enable 2FA** - Enable two-factor authentication for admin accounts
4. **Regular Audits** - Review user access quarterly
5. **Password Rotation** - Implement password rotation policy

### Deployment Checklist

- [ ] Database migrated successfully
- [ ] Environment variables configured
- [ ] Run `./scripts/database/setup-production-users.sh`
- [ ] Verify patti can login
- [ ] Verify Jim can login
- [ ] Test Production Scheduler access
- [ ] Change default passwords
- [ ] Enable monitoring/alerts

### Troubleshooting

If users cannot access features:

1. **Re-run the setup script**:
   ```bash
   NODE_ENV=production ./scripts/database/setup-production-users.sh
   ```

2. **Check database connection**:
   ```bash
   NODE_ENV=production npx tsx scripts/database/check-connection.ts
   ```

3. **Verify permissions**:
   ```sql
   -- Check user roles
   SELECT u.username, r.name as role_name 
   FROM users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   JOIN roles r ON ur.role_id = r.id 
   WHERE u.username IN ('patti', 'Jim');
   ```

### Contact

For production access issues:
- Primary: Patti (System Administrator)
- Secondary: Jim (System Administrator)

---

**Last Updated**: November 2025
**Script Location**: `/scripts/database/ensure-production-users-access.ts`