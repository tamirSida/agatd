# Post-Deployment Testing Checklist

Use this checklist to verify that all functionality is working correctly after deploying your site to Netlify.

## Basic Site Functionality

- [ ] Site loads correctly at your Netlify domain
- [ ] Product catalog displays correctly
- [ ] Category tabs work (All Products, Alcohol, Whiskey, Wine, Beer, Food)
- [ ] Product filtering works (by country, category, client)
- [ ] Product search functions properly
- [ ] Product modal opens when clicking on a product
- [ ] Images load properly (check multiple products)
- [ ] Site is responsive on mobile devices

## Authentication

- [ ] Login page loads correctly
- [ ] "Remember me" checkbox works
- [ ] "Show password" toggle works
- [ ] Existing users can log in successfully
- [ ] Password reset works
- [ ] Registration requests are saved to the database
- [ ] Automatic redirect to proper page based on user role

## Client Features

- [ ] Clients can view the product catalog
- [ ] Heart buttons are visible for client users only
- [ ] Clients can "like" products in the grid view
- [ ] Clients can "like" products in the modal view
- [ ] Liked products show filled heart icon
- [ ] Clients can access the "מועדפים" (favorites) page
- [ ] Favorites page shows only products the client has liked
- [ ] Clients can remove products from favorites page

## Agent Features

- [ ] Agents can log in and access the agent dashboard
- [ ] Agent dashboard displays correctly
- [ ] Tabs in the agent dashboard work properly
- [ ] "הלקוחות שלי" (My Clients) tab shows the agent's clients
- [ ] "מועדפים" (Likes) tab shows products liked by the agent's clients
- [ ] No heart buttons are visible to agents
- [ ] Client filtering works in the likes tab

## Admin Features

- [ ] Admins can log in and access the admin dashboard
- [ ] Admin dashboard tabs work properly
- [ ] User management tab functions correctly
- [ ] Admins can view all users
- [ ] Admins can create new users
- [ ] Agent selection appears when creating client users
- [ ] Agent dropdown is populated with all agents
- [ ] Registration requests tab shows pending requests
- [ ] Admins can approve/reject registration requests

## Database Operations

- [ ] New users are correctly added to the 'users' collection
- [ ] New clients are correctly added to the 'clients' collection
- [ ] Client-agent relationships are properly stored
- [ ] Product likes are properly recorded in the database
- [ ] Changes to user accounts are saved properly

## Security

- [ ] Non-authenticated users cannot access protected pages
- [ ] Clients cannot access agent or admin dashboards
- [ ] Agents cannot access the admin dashboard
- [ ] Firebase security rules are working as expected

## Browser Compatibility

- [ ] Test site in Chrome
- [ ] Test site in Firefox
- [ ] Test site in Safari
- [ ] Test site in Edge (if available)
- [ ] Test site on iOS mobile devices
- [ ] Test site on Android mobile devices

## Performance

- [ ] Site loads within a reasonable time
- [ ] Product filtering is responsive
- [ ] No significant delays when clicking between tabs
- [ ] Heart button interactions are immediate
- [ ] Modal windows open promptly

## Error Handling

- [ ] Incorrect login credentials show appropriate error message
- [ ] Registration with existing email shows appropriate error
- [ ] Password reset for non-existent email shows appropriate error
- [ ] Missing images show the "image not found" message
- [ ] Failed API requests (e.g., to Google Sheets) show appropriate error

## Notes

Add any issues found during testing here:

1. 
2. 
3. 

## Resolution Plan

For any issues identified, document the plan to fix them:

1. 
2. 
3. 