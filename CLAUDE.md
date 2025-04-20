# AGAT Catalog Project Documentation

## Project Overview
A product catalog web application for AGAT that displays products from different categories (Alcohol, Whiskey, Wine, Beer, Food). The application allows filtering by category, country, and client.

## Data Sources
All data is loaded directly from Google Sheets:

1. **Alcohol**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv`
2. **Wine**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv`
3. **Beer**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv` 
4. **Food**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv`
5. **Whiskey**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv`
6. **Clients**: `brands.csv` (local file with list of all client/store names)

## File Structure
- `index.html` - Main HTML file 
- `app.js` - JavaScript application logic
- `styles.css` - CSS styles
- `brands.csv` - List of all clients/stores
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
6. **Like Feature**: Heart icon to mark favorite products in both grid and modal views

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
9. **Availability**: If a client is selected, shows availability status

## Technical Implementation Notes

### Data Loading
- Uses direct Google Sheets URLs with CSV output format 
- Fetches all data in parallel
- Handles error cases gracefully
- Adds a retry button if data loading fails

### Client Filter
The client filter loads from brands.csv and populates a dropdown that filters products to only show those where the selected client column has a value of "TRUE". Each product has multiple client columns, with a "TRUE" value indicating the product is available for that specific client.

### Image Handling
Product images are fetched using the barcode as the filename:
1. First tries to load from `tl/[barcode].jpg`
2. If not found, falls back to `media/[barcode].jpg`
3. If still not found, falls back to `images/logo.png` and shows an "image not found" message

## Development Timeline
- Initial implementation focused on alcohol products
- Added support for wine, beer, food, and whiskey categories
- Enhanced product card display with category-specific field mapping
- Improved visual design with animated tab navigation, product cards with hover effects, and consistent styling
- Converted brand filter from modal to dropdown for better user experience and consistent design
- Implemented dedicated client filtering by column instead of brand/company name
- Made client filter available on all tabs including food
- Fixed client filtering to check for "TRUE" values in client columns

## Recent Fixes
- Fixed client dropdown filter to properly filter products by checking for "TRUE" values in columns named after clients
- Updated client filter to be consistently available across all product tabs
- Made client filtering case-insensitive to handle variations like "TRUE", "true", etc.
- Improved client filter loading to first try local file before falling back to Google Sheets
- Added proper error handling for missing client data
- Removed code that replaced client filter with product brands on certain tabs
- Standardized client filter label to consistently show "כל הלקוחות" across all tabs
- Fixed filter behavior to correctly handle cases where client data may be missing
- Added heart icon feature for liking products in both grid view and detail modal
- Updated image fallback to use company logo when product images aren't found