# Updating Your Existing Netlify Site

This document provides instructions for updating your existing Netlify site with the new Firebase authentication and backend features.

## Prerequisites

- Access to your existing Netlify site dashboard
- Access to the Firebase console for your project
- The updated code files (HTML, JS, CSS) with Firebase integration

## 1. Update Your Site Files

### Option 1: Manual Upload

If you're not using continuous deployment with Git:

1. Go to your Netlify dashboard and select your site
2. Navigate to **Site** → **Deploys**
3. Drag and drop your entire project folder to the deploy area
   - Make sure to include ALL files (HTML, JS, CSS, images, _redirects, _headers, netlify.toml)
   - This will overwrite existing files and add new ones

### Option 2: Using Netlify CLI

If you prefer using the command line:

1. Install Netlify CLI if you haven't already:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in to your Netlify account:
   ```bash
   netlify login
   ```

3. Link your local project to your Netlify site:
   ```bash
   cd /path/to/your/project
   netlify link
   ```
   - Select your team and site from the list

4. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Git Integration

If your site is already connected to a Git repository:

1. Push the updated code to your repository
2. Netlify will automatically detect the changes and deploy them

## 2. Configure Environment Variables

Set up the necessary Firebase environment variables in your Netlify site:

1. Go to your Netlify dashboard and select your site
2. Navigate to **Site settings** → **Build & deploy** → **Environment**
3. Click **Edit variables**
4. Add the following environment variables:

| Variable Name | Value |
|---------------|-------|
| `FIREBASE_API_KEY` | `AIzaSyDASzvsx7igxJ0FQe2ikv-WLt7l05tahPw` |
| `FIREBASE_AUTH_DOMAIN` | `agatd-e37c7.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `agatd-e37c7` |
| `FIREBASE_STORAGE_BUCKET` | `agatd-e37c7.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `1005336153638` |
| `FIREBASE_APP_ID` | `1:1005336153638:web:8838a025f3b8f171ca60e7` |
| `FIREBASE_MEASUREMENT_ID` | `G-SL0XPS0WGM` |

5. Click **Save**

## 3. Configure Firebase for Your Netlify Domain

You need to add your Netlify domain to Firebase's authorized domains:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`agatd-e37c7`)
3. In the left sidebar, click on **Authentication**
4. Go to the **Settings** tab
5. Scroll down to the **Authorized domains** section
6. Click **Add domain**
7. Enter your Netlify domain (e.g., `your-site-name.netlify.app`)
8. Click **Add**

> **Note**: If you have a custom domain, add that too.

## 4. Verify Firestore Security Rules

Make sure your Firestore security rules are properly configured:

1. Go to the Firebase Console
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Compare the rules with your local `firestore.rules` file
5. Update if necessary and click **Publish**

## 5. Test Your Updated Site

After deploying, thoroughly test the following:

1. User login and registration
2. Role-based access (admin, agent, client)
3. Product browsing and filtering
4. "Like" functionality for clients
5. Agent dashboard access to client likes
6. Admin user management functions

## Troubleshooting Common Issues

### Authentication Issues

If users can't log in:

1. Check that your Netlify domain is added to Firebase Authentication's authorized domains
2. Verify Firebase environment variables are correctly set in Netlify
3. Check browser console for specific error messages

### Firestore Access Issues

If users can't access data:

1. Verify Firestore security rules are correctly configured
2. Check user roles in the database
3. Make sure clients collection is properly set up

### Missing Features

If certain features aren't working:

1. Ensure all new HTML files are uploaded (admin.html, agent.html, favorites.html)
2. Check that firebase-config.js is properly uploaded and linked in HTML files
3. Verify all Firebase SDK scripts are loaded in your HTML files

## Next Steps

After successfully updating your site:

1. Create test users with different roles (admin, agent, client)
2. Set up client-to-agent assignments
3. Add some test "likes" to products to verify the functionality
4. Consider adding monitoring using Firebase Performance Monitoring

For more detailed setup information, refer to the FIREBASE_SETUP.md file.