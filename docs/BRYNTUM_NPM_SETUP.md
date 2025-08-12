# Bryntum Gantt NPM Setup Guide

## Overview
This guide documents the proper way to set up Bryntum Gantt with NPM for production deployment. Currently, we're using the UMD build for development, but for production, you should follow these steps to use the official NPM packages.

## Step 1: Configure NPM Registry

Configure npm to use the Bryntum registry for the `@bryntum` scope:

```bash
# Configure registry (use quotes for Windows PowerShell)
npm config set "@bryntum:registry=https://npm.bryntum.com"

# Or for US-based repository
npm config set "@bryntum:registry=https://npm-us.bryntum.com"

# Verify configuration
npm config list
# Should show: @bryntum:registry = "https://npm.bryntum.com"
```

## Step 2: Login to Bryntum Registry

### For Trial Version
Use your email with `@` replaced by `..` (double dots) and password `trial`:

```bash
npm login --registry=https://npm.bryntum.com

# Example:
# Username: user..yourdomain.com (if your email is user@yourdomain.com)
# Password: trial
# Email: user@yourdomain.com
```

### For Licensed Version
Use your Bryntum Customer Zone credentials:

```bash
npm login --registry=https://npm.bryntum.com

# Username: user..yourdomain.com (your Customer Zone email with @ replaced by ..)
# Password: your-customer-zone-password
# Email: user@yourdomain.com
```

**Note**: If you see a rotating spinner after the password prompt (npm 10.7+), enter your password and press Enter.

## Step 3: Install Bryntum Packages

### Trial Version Installation

```bash
# Install trial version with aliasing
npm install @bryntum/gantt@npm:@bryntum/gantt-trial@6.3.1 --save-exact
npm install @bryntum/gantt-react@6.3.1 --save-exact

# Or add to package.json:
```

```json
{
  "dependencies": {
    "@bryntum/gantt": "npm:@bryntum/gantt-trial@6.3.1",
    "@bryntum/gantt-react": "6.3.1"
  }
}
```

### Licensed Version Installation

```bash
# Install licensed version
npm install @bryntum/gantt@6.3.1 --save-exact
npm install @bryntum/gantt-react@6.3.1 --save-exact

# Or add to package.json:
```

```json
{
  "dependencies": {
    "@bryntum/gantt": "6.3.1",
    "@bryntum/gantt-react": "6.3.1"
  }
}
```

## Step 4: Vite Configuration

Add Bryntum packages to `optimizeDeps` in `vite.config.ts`:

```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      '@bryntum/gantt',
      '@bryntum/gantt-react'
    ]
  }
});
```

## Step 5: React Implementation

Once packages are installed, use the official React wrapper:

```tsx
import { BryntumGantt } from '@bryntum/gantt-react';
import '@bryntum/gantt/gantt.stockholm.css';

function MyGantt() {
  const ganttConfig = {
    columns: [
      { type: 'name', field: 'name', width: 250 }
    ],
    viewPreset: 'weekAndDayLetter',
    barMargin: 10,
    project: {
      tasks: taskData,
      resources: resourceData,
      assignments: assignmentData
    }
  };

  return (
    <BryntumGantt
      {...ganttConfig}
      onTaskDrop={handleTaskDrop}
      onTaskResizeEnd={handleTaskResize}
    />
  );
}
```

## Migrating from Trial to Licensed

Simply change the package.json from:

```json
"@bryntum/gantt": "npm:@bryntum/gantt-trial@6.3.1"
```

To:

```json
"@bryntum/gantt": "6.3.1"
```

Then run `npm install`.

## Multi-User Access

For teams, you have two options:

1. **Shared Token**: Create an access token and share it with the team
2. **Individual Logins**: Each developer logs in with their own credentials

### Creating an Access Token

```bash
# Create token (replace with your credentials)
curl -u user..yourdomain.com:password https://npm.bryntum.com/-/npm/v1/tokens

# Add token to .npmrc
echo "//npm.bryntum.com/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc
```

## Troubleshooting

### NPM Version Requirements
- Minimum: npm 6.9.0 or 7.11.0 (for package aliasing support)
- Check version: `npm -v`

### Yarn Support
After npm authentication, Yarn can also be used:

```bash
# Yarn v1 - works automatically after npm login
yarn add @bryntum/gantt@npm:@bryntum/gantt-trial

# Yarn v2+ - requires .yarnrc.yml configuration
```

### Common Issues

1. **404 Not Found**: Ensure you're logged in and have configured the registry
2. **Rotating Spinner**: Just enter password and press Enter
3. **Authentication Failed**: Check email format (@ replaced with ..)
4. **Version Conflicts**: Use exact versions (`--save-exact`) for all Bryntum packages

## Current Development Setup

**Note**: Currently using UMD build in development. To switch to NPM packages:

1. Complete steps 1-3 above
2. Remove `client/public/gantt.umd.js` and script tag from `index.html`
3. Update imports to use `@bryntum/gantt-react`
4. Deploy with proper npm authentication in CI/CD pipeline