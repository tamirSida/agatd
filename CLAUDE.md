# AGAT Catalog Project Documentation

## Project Overview
A product catalog web application for AGAT that displays products from different categories (Alcohol, Whiskey, Wine, Beer, Food). The application allows filtering by category, country, and client. The application includes a complete user authentication system with Firebase, role-based access control (admin, agent, client roles), and features like a "like" system for clients to save favorite products.

## Data Sources
All data is loaded directly from Google Sheets URLs without any local file dependencies:

1. **Alcohol**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv`
2. **Wine**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv`
3. **Beer**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv` 
4. **Food**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv`
5. **Whiskey**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv`
6. **Clients/Brands**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRbLyJcDTPOjBtcGOSKUXYuKn5U8_sRF_KOSgFwiyPoeO3YazAxOhXXVCSK7M94-yxyO7j1fr5J3ou_/pub?output=csv`

## File Structure
- `index.html` - Main HTML file with product catalog
- `app.js` - JavaScript application logic
- `styles.css` - CSS styles
- `login.html` - User authentication page with login/register forms
- `admin.html` - Admin dashboard for user management
- `agent.html` - Agent dashboard for client monitoring
- `favorites.html` - Client's saved/liked products page
- `shopping-cart.html` - Client's shopping cart for managing orders
- `orders-admin.html` - Admin dashboard for order management
- `orders-agent.html` - Agent dashboard for viewing client orders
- `firebase-config.js` - Firebase configuration with environment variable support
- `firestore.rules` - Firestore security rules
- `netlify.toml` - Netlify deployment configuration
- `_redirects` - URL routing rules for Netlify
- `_headers` - Security headers for Netlify
- `README.md` - Overview of the project
- `DEPLOYMENT.md` - Deployment guide for Netlify
- `DEPLOYMENT_UPDATE.md` - Guide for updating existing Netlify site
- `FIREBASE_SETUP.md` - Firebase configuration for Netlify
- `TESTING_CHECKLIST.md` - Post-deployment testing checklist
- `tl/` - Directory containing product images named by barcode
- `media/` - Fallback directory for product images

## Key Features
1. **Tab Navigation**: Switch between all products, alcohol, whiskey, wine, beer, and food
2. **Filtering**:
   - By country (dropdown)
   - By category (dropdown)
   - By client (לקוח) (dropdown)
   - Text search with search button
3. **Product Cards**: Display product information with images
4. **Product Modals**: Detailed view of product with all specifications
5. **Responsive Design**: Works well on mobile and desktop devices
6. **User Authentication**: Login system with role-based access
7. **Like Feature**: Heart icon to mark favorite products with Firebase storage
8. **Shopping Cart**: Clients can add products to cart with quantity selection
9. **Order System**: Clients can submit orders to agents through the shopping cart
10. **Admin Panel**: User management, client assignments, and view restrictions
11. **Agent Dashboard**: Monitor clients, view their liked products and orders
12. **Client Restrictions**: Limit client views to specific brands only

## User Roles and Permissions
The system has three user roles:

1. **Admin**:
   - Full access to all features
   - Can create and manage users (add, edit, delete)
   - Can assign clients to agents
   - Can approve or reject registration requests
   - Can set client view restrictions
   - Can view all clients' liked products
   - Can access admin dashboard
   - Cannot like products (heart icons are hidden)

2. **Agent**:
   - Can access the agent dashboard
   - Can view all assigned clients' information
   - Can view products liked by their assigned clients
   - Can view all products in the catalog
   - Cannot like products (heart icons are hidden)
   - Cannot access admin dashboard
   - Cannot manage users directly

3. **Client**:
   - Can view the main product catalog
   - Can view only products that match their allowed brands (if restrictions are set)
   - Can like products by clicking heart icons
   - Can add products to shopping cart with quantity selection
   - Can send orders to their assigned agent
   - Can view their favorites page with all liked products
   - Can remove products from their favorites
   - Cannot access admin or agent dashboards

## Firebase Setup for User Management

### Setting up an Admin User
1. Create a user in Firebase Authentication (Email/Password)
2. In Firestore, create the following documents:
   - `/users/{user_uid}` with fields:
     - `email`: string (user's email)
     - `role`: string (value: "admin")
     - `createdAt`: timestamp
   - `/clients/{user_uid}` with fields:
     - `email`: string (user's email)
     - `allowedBrands`: array (empty)
     - `likes`: array (empty)
     - `createdAt`: timestamp

### Setting up an Agent User
1. Create a user in Firebase Authentication (Email/Password)
2. In Firestore, create the following documents:
   - `/users/{user_uid}` with fields:
     - `email`: string (user's email)
     - `role`: string (value: "agent")
     - `createdAt`: timestamp
   - `/agents/{user_uid}` with fields:
     - `email`: string (user's email)
     - `clients`: array (empty, will contain client UIDs)
     - `createdAt`: timestamp
   - `/clients/{user_uid}` with fields:
     - `email`: string (user's email)
     - `allowedBrands`: array (empty)
     - `likes`: array (empty)
     - `agentId`: string (agent's UID)
     - `createdAt`: timestamp

### Setting up a Client User
1. Create a user in Firebase Authentication (Email/Password)
2. In Firestore, create the following documents:
   - `/users/{user_uid}` with fields:
     - `email`: string (user's email)
     - `role`: string (value: "client")
     - `createdAt`: timestamp
   - `/clients/{user_uid}` with fields:
     - `email`: string (user's email)
     - `allowedBrands`: array (brands the client is allowed to see)
     - `likes`: array (empty, will contain product barcodes)
     - `cart`: array (empty, will contain cart items)
     - `lastOrderId`: string (optional, ID of last submitted order)
     - `lastOrderDate`: timestamp (optional, date of last order)
     - `agentId`: string (optional, ID of assigned agent)
     - `createdAt`: timestamp

### Alternative: Using the Admin Panel
Instead of manually creating documents in Firestore, you can:
1. Create one admin user manually as described above
2. Login with this admin user to the Admin Panel (`admin.html`)
3. Use the 'Add User' form to create other users of any role

## Product Display Fields 
Each product card displays the following information, with different field mappings based on the product category:

1. **Image**: From the barcode
2. **Name/Title**:
   - **Alcohol**: `מקט` or `שם פריט אוטומטי`
   - **Whiskey**: `תיאור פריט` or `שם פריט אוטומטי`
   - **Wine**: `תאור` or `שם פריט אוטומטי`
   - **Beer/Food**: `שם פריט אוטומטי`
3. **Brand/Company**: From `קבוצה / מותג` or `קבוצה / מותג אוטומטי` or `מותג`
4. **Country**: With flag icon
5. **Kosher Status**: For beer/alcohol products
6. **Volume**: For beverages
7. **Weight**: For food products
8. **Description**: From `תאור` or `תיאור פריט`
9. **Price**: Primarily from `מחירון` field (with ₪ symbol), or falls back to `מחיר` field if `מחירון` is not available
10. **Availability**: If a client is selected, shows availability status
11. **Like Button**: Heart icon to mark products as favorites (requires login)
12. **Cart Button**: Shopping cart icon to add products to cart with quantity selection (requires login)

## Technical Implementation Notes

### Data Loading
- Uses direct Google Sheets URLs with CSV output format for all data (products and client brands)
- Does not rely on any local CSV files - all data is fetched from remote sources
- Fetches all data in parallel
- Handles error cases gracefully
- Adds a retry button if data loading fails
- No local fallbacks - fully depends on remote API endpoints

### Recent Bug Fixes and Improvements
- Fixed client filter in admin panel to only show actual client users (not admins or agents)
  - Updated `loadClientsForLikesFilter()` function to first query users with CLIENT role
  - Previously all records in the 'clients' collection were shown (including admins/agents)
  - Now filters by checking user role before displaying in the dropdown
- Fixed user creation functionality in admin panel and agent panel
  - Changed to use Firebase Auth REST API to create users without logging out the admin/agent
  - Added explicit logging and proper promise handling for Firestore operations
  - Ensured all database documents are created properly before completion
  - Added proper error handling and visual feedback during user creation
  - Fixed admin and agent creation to avoid adding documents to clients collection
- Improved order management
  - Added order deletion capability for admins and agents with confirmation dialog
  - Added stylized delete buttons to order cards for easy access
  - Fixed database rules to maintain proper role-based document access
- Added support for price list field (`מחירון`)
  - Price list field is now displayed in product cards, modals, and shopping cart
  - Styled differently to distinguish from regular price
  - Prioritized over regular price field (`מחיר`) when available
- Fixed touch support for smartphones
  - Improved product card click handling with better touch events
  - Added defensive null checks in modal opening to prevent errors
  - Enhanced error handling with proper user feedback
- Fixed favorites page (favorites.html) errors
  - Resolved reference errors by properly initializing DOM elements
  - Fixed function declaration conflicts with firebase-config.js
  - Added defensive null checks to prevent errors when accessing elements
  - Improved error handling and user feedback
- Fixed client filter visibility in catalog
  - Updated the client filter to remain consistently hidden for CLIENT role users
  - Fixed the filter visibility logic when switching between tabs
  - Ensured proper display across all catalog views

### Client Filter
The client filter loads directly from the Google Sheets URL and populates a dropdown that filters products to only show those where the selected client column has a value of "TRUE". Each product has multiple client columns, with a "TRUE" value indicating the product is available for that specific client.

### Authentication
- Uses Firebase Authentication for user management
- Login page handles authentication and redirects based on user role
- Features "Remember me" option with Firebase persistence
- "Show password" toggle button for better user experience
- User can request password reset via email
- Access control for admin and agent pages
- Registration requests system for new users (admins approve/reject)

### Client-Agent Relationship
- Admins can assign clients to specific agents
- Agents can only see their assigned clients' information and likes
- When creating a client user, admin can select which agent will manage them
- One client can belong to only one agent

### Favorites System
- Likes are stored in Firestore for each client
- Updates in real-time when user clicks heart icons
- Heart icons only visible to client users (hidden for admin/agent)
- Clients can view their favorites on a dedicated page
- Clients can remove items from favorites
- Clients can add products to cart directly from favorites page
- Agents can view their clients' liked products in their dashboard
- Agents can filter liked products by specific client
- Admins can view all liked products across the system

### Shopping Cart System
- Cart items are stored in Firestore for each client
- Quantity selection modal appears when adding items to cart
- Cart items can be added from catalog, product modal, or favorites page
- Clients can view their cart with item quantities on a dedicated page
- Clients can modify quantities or remove items from cart
- Clients can add notes to their order before submitting
- Orders are submitted to the client's assigned agent
- Cart is cleared after order submission

### Order Management System
- Orders are stored in Firestore with client, agent, and product information
- Each order has a status (pending, processing, completed, cancelled)
- Agents can view orders from their assigned clients
- Agents can update order status, add notes, or delete orders
- Admins can view all orders across the system
- Admins can filter orders by client, agent, status, or date
- Both admins and agents can permanently delete orders with confirmation
- Price list field (`מחירון`) is displayed throughout the order process

### Deployment
- Ready for Netlify deployment with proper configuration
- Firebase integration with environment variables
- Security headers and routing rules for Netlify
- Documentation for updating existing site or creating new one
- Post-deployment testing checklist

### Image Handling
Product images are fetched using the barcode as the filename:
1. First tries to load from `tl/[barcode].jpg`
2. If not found, falls back to `media/[barcode].jpg`
3. If still not found, falls back to `images/logo.png` and shows an "image not found" message

### Database Structure
The application uses the following collections in Firebase Firestore:

1. **users**: Stores basic user information and role
   - `email`: User's email address
   - `role`: User role (admin, agent, or client)
   - `createdAt`: Timestamp when user was created

2. **clients**: Stores client-specific data
   - `email`: Client's email address
   - `agentId`: UID of assigned agent (if applicable)
   - `allowedBrands`: Array of brand names client is allowed to see
   - `likes`: Array of product barcodes the client has liked
   - `cart`: Array of products in the client's shopping cart
   - `lastOrderId`: ID of client's last order (if any)
   - `lastOrderDate`: Timestamp of client's last order
   - `createdAt`: Timestamp when client was created

3. **agents**: Stores agent-specific data
   - `email`: Agent's email address
   - `clients`: Array of client UIDs assigned to this agent
   - `createdAt`: Timestamp when agent was created

4. **orders**: Stores order information
   - `clientId`: UID of client who placed the order
   - `clientEmail`: Email of client who placed the order
   - `agentId`: UID of agent assigned to the client
   - `items`: Array of product objects in the order (including price and מחירון fields)
   - `notes`: Optional notes from the client
   - `status`: Order status (pending, processing, completed, cancelled)
   - `createdAt`: Timestamp when order was created
   - `updatedAt`: Timestamp when order was last updated

5. **registrationRequests**: Stores pending registration requests
   - `email`: Requested email address
   - `password`: Requested password
   - `requestedRole`: Requested user role
   - `status`: Request status (pending, approved, rejected)
   - `createdAt`: Timestamp when request was created

Security rules ensure that:
- Clients can only access and modify their own data
- Agents can view data for their assigned clients
- Admins have full access to all collections
- Order deletion is restricted to admins and agents