# AGAT Catalog Project Information

## Project Overview
This is a product catalog web application for AGAT that displays products from different categories. The application allows filtering by category, country, and brand.

## Data Sources
1. **Brands**: `brands.csv` - Contains a list of all client/store brands
2. **Alcohol Products**: Loaded from Google Sheets at `https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv`
3. **Wine Products**: Loaded from Google Sheets
4. **Food Products**: Loaded from Google Sheets

## File Structure
- `index.html` - Main HTML file
- `app.js` - JavaScript application logic
- `styles.css` - CSS styles
- `brands.csv` - List of all brands/clients
- `tl/` - Directory containing product images named by barcode
- `media/` - Fallback directory for product images

## Key Features
1. **Tab Navigation**: Switch between all products, alcohol, wine, and food
2. **Filtering**:
   - By country
   - By category
   - By brand/client (מלקוח)
   - Text search
3. **Product Cards**: Display product information with images
4. **Product Modal**: Detailed view of product with all specifications
5. **Brand Filter Modal**: List of all brands for filtering

## Implementation Details

### Brand Filter
The brand filter button opens a modal with a list of all brands from `brands.csv`. When a brand is selected, the application filters products to only show those where that brand column has a value of "TRUE". 

The brands are sorted alphabetically in Hebrew for easy navigation.

### CSV Parsing
The application parses CSV data from external sources (Google Sheets) or local files as fallback. The CSV structure includes columns for each brand (TRUE/FALSE value indicates if a product is available in that brand's store).

### Image Handling
Product images are fetched using the barcode as the filename:
1. First tries to load from `tl/[barcode].jpg`
2. If not found, falls back to `media/[barcode].jpg`
3. If still not found, shows a placeholder image

## Future Enhancements
1. Apply same brand filter functionality to Wine and Food tabs
2. Optimize image loading for better performance
3. Add multi-brand selection capability
4. Add export functionality for filtered product lists