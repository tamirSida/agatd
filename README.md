# AGAT Catalog - Firebase Authentication & Netlify Deployment

This README provides an overview of the AGAT Catalog project's documentation files and deployment resources.

## Project Overview

The AGAT Catalog is a web application that displays products from different categories (Alcohol, Whiskey, Wine, Beer, Food) with features for filtering, user authentication, and personalized experiences.

The application now includes:
- Firebase Authentication with role-based access (Admin, Agent, Client)
- User management dashboard for Admins
- Client management interface for Agents
- "Like" functionality for Clients to save favorite products
- Responsive design for mobile and desktop devices

## Documentation Files

### Project Specifications
- **CLAUDE.md**: Main project documentation with feature descriptions and technical details

### Deployment Documentation
- **DEPLOYMENT.md**: General deployment guide for setting up the site on Netlify
- **DEPLOYMENT_UPDATE.md**: Specific instructions for updating an existing Netlify site
- **FIREBASE_SETUP.md**: Setup guide for Firebase Authentication and Firestore
- **TESTING_CHECKLIST.md**: Post-deployment testing checklist to ensure everything works

### Configuration Files
- **netlify.toml**: Configuration file for Netlify deployment
- **_redirects**: URL redirection rules for client-side routing
- **_headers**: Security headers for the Netlify site
- **firestore.rules**: Security rules for Firestore database
- **firebase-config.js**: Firebase initialization with environment variable support

## Main Application Files

### HTML Files
- **index.html**: Main product catalog with filtering
- **login.html**: User authentication page
- **admin.html**: Admin dashboard for user management
- **agent.html**: Agent dashboard for client management
- **favorites.html**: Client's saved/liked products page

### JavaScript
- **app.js**: Main application logic
- **fallback-data.js**: Fallback data when API calls fail
- **setup-collections.js**: Script for initializing Firebase collections

### Other Resources
- **styles.css**: Application styling
- **brands.csv**: List of client/store names
- **tl/**: Directory with product images
- **images/**: Application images and logo

## Getting Started

If you're updating your existing Netlify site:
1. Review **DEPLOYMENT_UPDATE.md** for step-by-step instructions
2. Set up Firebase Authentication as described in **FIREBASE_SETUP.md**
3. Use the **TESTING_CHECKLIST.md** to verify functionality after deployment

If you're setting up a new deployment:
1. Follow the complete guide in **DEPLOYMENT.md**
2. Configure Firebase as described in **FIREBASE_SETUP.md**

## User Roles and Functionality

### Admin
- Manage users (create, edit, delete)
- Approve registration requests
- Assign clients to agents
- View all catalog data

### Agent
- View assigned clients
- See products liked by their clients
- Access the full product catalog

### Client
- Browse and filter products
- "Like" products to save favorites
- View a personalized favorites page

## Important Security Notes

1. Always add your Netlify domain to Firebase Authentication's authorized domains
2. Set proper environment variables in Netlify for Firebase configuration
3. Ensure Firestore security rules are properly configured
4. Never commit sensitive API keys or credentials to the repository