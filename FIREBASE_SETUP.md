# Firebase Configuration for Netlify

This document explains how to set up and configure Firebase to work with your Netlify deployment.

## 1. Add Netlify Domain to Firebase Authentication Whitelist

Firebase Authentication restricts sign-in operations to domains that you've verified. You need to add your Netlify domain to the allowed domains list:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`agatd-e37c7`)
3. In the left sidebar, click on **Authentication**
4. Go to the **Settings** tab
5. Scroll down to the **Authorized domains** section
6. Click **Add domain**
7. Enter your Netlify domain (e.g., `your-site-name.netlify.app`)
8. Click **Add**

> **Important**: If you have a custom domain configured in Netlify, you should add that domain as well.

## 2. Configure Environment Variables in Netlify

To securely use Firebase in your Netlify deployment, you should set the Firebase configuration as environment variables:

1. Go to the [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment**
4. Click **Edit variables**
5. Add the following environment variables:

| Variable Name | Value |
|---------------|-------|
| `FIREBASE_API_KEY` | `AIzaSyDASzvsx7igxJ0FQe2ikv-WLt7l05tahPw` |
| `FIREBASE_AUTH_DOMAIN` | `agatd-e37c7.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `agatd-e37c7` |
| `FIREBASE_STORAGE_BUCKET` | `agatd-e37c7.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `1005336153638` |
| `FIREBASE_APP_ID` | `1:1005336153638:web:8838a025f3b8f171ca60e7` |
| `FIREBASE_MEASUREMENT_ID` | `G-SL0XPS0WGM` |

6. Click **Save**

## 3. Verify Firestore Rules

Make sure your Firestore security rules are properly configured to secure your data:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left sidebar, click on **Firestore Database**
4. Go to the **Rules** tab
5. Verify your rules match the ones in your local `firestore.rules` file
6. If they don't match, copy and paste your rules from your local file
7. Click **Publish**

## 4. Update Firebase Project Settings (Optional)

If your site is experiencing any CORS issues, you may need to add your Netlify domain to your Firebase project's authorized domains:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project settings** → **General**
4. Scroll down to the **Your apps** section
5. Click on the web app (should be named "AGAT")
6. In the **Authorized domains** section, click **Add domain**
7. Enter your Netlify domain
8. Click **Add**

## 5. Testing Authentication

After deploying your site to Netlify, test the authentication flow:

1. Visit your Netlify site
2. Try to log in with an existing user account
3. Verify that the login process works correctly and redirects to the appropriate page
4. If you encounter any issues, check the browser console for error messages

## Troubleshooting

If you encounter issues with Firebase authentication on your Netlify site:

1. **CORS Errors**: Make sure your Netlify domain is added to the authorized domains in both Firebase Authentication and Project Settings.

2. **Environment Variables Not Working**: Verify that your environment variables are correctly set in Netlify. The firebase-config.js file should be using these variables when in production.

3. **Deployment Issues**: Ensure you've deployed all the necessary files to Netlify, including the firebase-config.js file and all the HTML files.

4. **Firestore Access Issues**: Check your Firestore rules to ensure they allow the necessary read/write operations for your authenticated users.