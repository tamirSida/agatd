# AGAT Catalog Deployment Guide

This document explains how to deploy the AGAT catalog application to Netlify with Firebase integration.

## Prerequisites

- A [Netlify](https://www.netlify.com) account
- A [Firebase](https://firebase.google.com) project (already set up)
- Git repository of the project (optional, but recommended)

## Deployment Steps

### 1. Set Up Netlify from the Command Line

1. Install Netlify CLI (if not already done):
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize your site (from the project directory):
   ```bash
   netlify init
   ```
   
   - Choose "Create & configure a new site"
   - Select your team
   - Enter a site name or press enter for a random name

### 2. Set Environment Variables in Netlify

You'll need to set up Firebase configuration as environment variables in Netlify:

1. Go to Netlify dashboard → Your site → Site settings → Build & deploy → Environment
2. Add the following environment variables:
   - FIREBASE_API_KEY
   - FIREBASE_AUTH_DOMAIN
   - FIREBASE_PROJECT_ID
   - FIREBASE_STORAGE_BUCKET
   - FIREBASE_MESSAGING_SENDER_ID
   - FIREBASE_APP_ID
   - FIREBASE_MEASUREMENT_ID

The values can be found in your .env file or firebase-config.js.

### 3. Deploy Your Site

#### Option 1: Deploy manually from the command line

```bash
# Deploy draft version
netlify deploy

# If everything looks good, deploy to production
netlify deploy --prod
```

#### Option 2: Connect to a Git repository for continuous deployment

1. In the Netlify dashboard, go to your site → Site settings → Build & deploy → Continuous Deployment
2. Connect to your Git provider (GitHub, GitLab, etc.)
3. Select your repository
4. Configure build settings if needed:
   - Build command: leave blank (no build process needed)
   - Publish directory: `.` (root directory)
5. Click "Deploy site"

### 4. Configure Firebase Security Rules

Make sure your Firebase Security Rules are properly configured to secure your data:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Review and update your security rules as needed

### 5. Test Your Deployment

After deployment, thoroughly test:

1. User authentication
2. Product browsing and filtering
3. Client, agent, and admin dashboards
4. Product likes functionality
5. User management features

### Troubleshooting Common Issues

1. **CORS Issues with Google Sheets**: If having CORS issues with Google Sheets API, consider:
   - Creating a Netlify Function as a proxy
   - Using a Firebase Function to fetch CSV data

2. **Authentication Issues**: Make sure you've:
   - Added your Netlify domain to Firebase Authentication allowed domains
   - Configured Firebase correctly for your environment

3. **Deployment Fails**: Check:
   - Netlify build logs
   - File size limits (Netlify has a soft limit of 15MB per file)
   - Path case sensitivity (Netlify hosting is case sensitive)

## Maintaining Your Deployment

### Updates and Re-deployments

If your site is connected to a Git repository:
1. Make changes and push to your repository
2. Netlify will automatically build and deploy the changes

For manual updates:
1. Make changes to your local files
2. Run `netlify deploy --prod` to deploy changes

### Monitoring

1. Use Netlify Analytics to monitor site traffic
2. Use Firebase Console to monitor authentication and database usage

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)