# AGAT Catalog Project Documentation

## Project Overview
A product catalog web application for AGAT that displays products from different categories (Alcohol, Whiskey, Wine, Beer, Food). The application allows filtering by category, country, and brand/client.

## Data Sources
All data is loaded directly from Google Sheets:

1. **Alcohol**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv`
2. **Wine**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv`
3. **Beer**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv` 
4. **Food**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv`
5. **Whiskey**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv`
6. **Brands**: `brands.csv` (local file with list of all client/store brands)

## File Structure
- `index.html` - Main HTML file 
- `app.js` - JavaScript application logic
- `styles.css` - CSS styles
- `brands.csv` - List of all brands/clients
- `tl/` - Directory containing product images named by barcode
- `media/` - Fallback directory for product images

## Key Features
1. **Tab Navigation**: Switch between all products, alcohol, whiskey, wine, beer, and food
2. **Filtering**:
   - By country (dropdown)
   - By category (dropdown)
   - By brand/client (לקוח) (dropdown)
   - Text search with search button
3. **Product Cards**: Display product information with images
4. **Product Modals**: Detailed view of product with all specifications
5. **Responsive Design**: Works well on mobile and desktop devices

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
9. **Availability**: If a brand is selected, shows availability status

## Technical Implementation Notes

### Data Loading
- Uses direct Google Sheets URLs with CSV output format 
- Fetches all data in parallel
- Handles error cases gracefully
- Adds a retry button if data loading fails

### Brand Filter
The brand filter loads from brands.csv and populates a dropdown that filters products to only show those where the selected brand column has a value of "TRUE".

### Image Handling
Product images are fetched using the barcode as the filename:
1. First tries to load from `tl/[barcode].jpg`
2. If not found, falls back to `media/[barcode].jpg`
3. If still not found, shows a placeholder image

## Development Timeline
- Initial implementation focused on alcohol products
- Added support for wine, beer, food, and whiskey categories
- Enhanced product card display with category-specific field mapping
- Improved visual design with animated tab navigation, product cards with hover effects, and consistent styling
- Converted brand filter from modal to dropdown for better user experience and consistent design
- Fixed ReferenceError related to updateBrandFilterButtonStatus function
- Removed unnecessary code related to the old brand filter modal implementation

## Recent Fixes
- Fixed a ReferenceError where `updateBrandFilterButtonStatus()` was called in the populateFilters function but no longer existed after converting from brand modal to dropdown
- Replaced the modal-related code with the appropriate `updateSelectStyling(brandFilter)` function
- Removed unused event listener for the brand filter modal that no longer exists
- Removed the "כל הקטגוריות פעילות כעת!" notification message
- Fixed search button positioning to match RTL layout (search icon on right side)
- Added 'x' clear buttons to all filter dropdowns for easily removing filters
- Improved filter usability with visual feedback when filters are active