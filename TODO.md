# AGAT Catalog - Testing and Tasks

## Bug Fixes to Test

### Admin Panel Client Filter
- [ ] Test the updated client filter in admin panel "Likes" tab
- [ ] Verify that only actual client users appear in the dropdown (no admins or agents)
- [ ] Confirm that selecting a client properly filters the likes shown
- [ ] Test with multiple test accounts to ensure filtering works as expected

## Other Tasks

### Netlify Deployment
- [ ] Set up Firebase environment variables in Netlify
- [ ] Add Netlify domain to Firebase authorized domains
- [ ] Test authentication system on the Netlify site
- [ ] Verify that all features work correctly after deployment

### Browser Compatibility
- [ ] Test site in Chrome
- [ ] Test site in Firefox
- [ ] Test site in Safari
- [ ] Test site on mobile devices

### Role-Based Features
- [ ] Test admin features (user management, client assignment)
- [ ] Test agent features (client viewing, likes filtering)
- [ ] Test client features (product likes, favorites page)

## Known Issues
- Browser extension errors may appear in console (can be safely ignored):
  - `Unchecked runtime.lastError: The page keeping the extension port is moved into back/forward cache...`
  - `Uncaught (in promise) FrameDoesNotExistError: Frame 0 does not exist in tab...`
- Resource not found errors for extension files (can be safely ignored):
  - `Failed to load resource: net::ERR_FILE_NOT_FOUND` for utils.js, extensionState.js, heuristicsRedefinitions.js
- Apple mobile web app warning:
  - Consider adding `<meta name="mobile-web-app-capable" content="yes">` to HTML head section