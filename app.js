// Global variables
let alcoholProducts = [];
let wineProducts = [];
let beerProducts = [];
let foodProducts = [];
let whiskeyProducts = [];
let allProducts = [];
let groupedProducts = {};
let brands = []; // Array to hold all brands
let currentFilters = {
  country: '',
  category: '',
  search: '',
  tab: 'all',
  brand: '' // New filter for brands
};

// DOM elements
const countryFilter = document.getElementById('country-filter');
const categoryFilter = document.getElementById('category-filter');
const brandFilter = document.getElementById('brand-filter');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const productsContainer = document.getElementById('products-container');
const modal = document.getElementById('product-modal');
const closeModalBtn = document.querySelector('.close');
const modalTitle = document.getElementById('modal-product-title');
const modalCompany = document.getElementById('modal-product-company');
const modalImage = document.getElementById('modal-product-image');
const modalDescription = document.getElementById('modal-product-description');
const modalSpecs = document.getElementById('modal-product-specs');
const modalVariants = document.getElementById('modal-product-variants');
const tabButtons = document.querySelectorAll('.tab-button');

// CSV URLs for each product category
const ALCOHOL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv';
const WINE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv';
const BEER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv';
const FOOD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv';
const WHISKEY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv';

// Local fallback CSV data (to use if remote fails due to CORS)
const LOCAL_ALCOHOL_CSV = 'AGAT- ALC - Sheet1.csv';
const LOCAL_WINE_CSV = 'AGAT - Wine.csv';
const LOCAL_BEER_CSV = 'AGAT - Beer.csv';
const LOCAL_FOOD_CSV = 'AGAT - Food.csv';
const LOCAL_WHISKEY_CSV = 'AGAT - Whiskey.csv';

// Fetch with timeout helper function
async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Add timestamp to avoid caching issues
    const urlWithCache = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
      
    const response = await fetch(urlWithCache, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Set longer timeout for big responses
      timeout: timeout
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    console.warn(`Fetch error for ${url}:`, error);
    throw new Error(`Failed to fetch from ${url}. This might be due to CORS restrictions or network issues.`);
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Show loading indication
    productsContainer.innerHTML = '<p style="text-align: center;">Loading products...</p>';

    // Load brands from CSV file
    await loadBrands();

    // Fetch data for all product categories
    try {
      console.log('Trying to fetch all product data:');
      
      // We'll use this to track loaded data
      const productData = {
        alcohol: [],
        wine: [],
        beer: [],
        food: [],
        whiskey: []
      };
      
      // Helper function to fetch a specific category
      async function fetchCategory(name, remoteUrl, localPath) {
        console.log(`Fetching ${name} data from ${remoteUrl}`);
        
        try {
          // Try remote first
          let response;
          
          // Make up to 2 attempts to fetch the data
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              console.log(`${name} fetch attempt ${attempt}...`);
              response = await fetchWithTimeout(remoteUrl, 15000);
              if (response.ok) break;
              console.warn(`${name} attempt ${attempt} failed with status: ${response.status}`);
            } catch (attemptError) {
              console.warn(`${name} attempt ${attempt} failed with error:`, attemptError);
              if (attempt === 2) throw attemptError;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (response && response.ok) {
            const text = await response.text();
            console.log(`Successfully fetched ${name} data from Google Sheets`);
            
            const data = parseCSV(text);
            console.log(`Successfully parsed ${name} data, rows:`, data.length);
            return data;
          }
          throw new Error(`HTTP error: ${response ? response.status + ' ' + response.statusText : 'No response'}`);
        } catch (remoteError) {
          // Try local file
          console.warn(`Failed to fetch ${name} from Google Sheets, trying local file:`, remoteError);
          
          if (!localPath) {
            console.error(`No local path for ${name}, giving up`);
            return []; // Return empty array if no local path
          }
          
          try {
            const localResponse = await fetch(localPath);
            
            if (localResponse.ok) {
              const localText = await localResponse.text();
              console.log(`Successfully loaded local ${name} CSV file`);
              
              const data = parseCSV(localText);
              console.log(`Successfully parsed local ${name} data, rows:`, data.length);
              return data;
            }
            throw new Error(`Local file HTTP error: ${localResponse.status}`);
          } catch (localError) {
            console.error(`Failed to load ${name} from local file:`, localError);
            return []; // Return empty array if both remote and local fail
          }
        }
      }
      
      // Fetch all categories in parallel
      const results = await Promise.allSettled([
        fetchCategory('alcohol', ALCOHOL_CSV_URL, LOCAL_ALCOHOL_CSV),
        fetchCategory('wine', WINE_CSV_URL, LOCAL_WINE_CSV),
        fetchCategory('beer', BEER_CSV_URL, LOCAL_BEER_CSV),
        fetchCategory('food', FOOD_CSV_URL, LOCAL_FOOD_CSV),
        fetchCategory('whiskey', WHISKEY_CSV_URL, LOCAL_WHISKEY_CSV)
      ]);
      
      // Process results
      alcoholProducts = results[0].status === 'fulfilled' ? results[0].value : [];
      wineProducts = results[1].status === 'fulfilled' ? results[1].value : [];
      beerProducts = results[2].status === 'fulfilled' ? results[2].value : [];
      foodProducts = results[3].status === 'fulfilled' ? results[3].value : [];
      whiskeyProducts = results[4].status === 'fulfilled' ? results[4].value : [];
      
      // Log results
      console.log('Parsed product counts:', {
        alcohol: alcoholProducts.length,
        wine: wineProducts.length,
        beer: beerProducts.length,
        food: foodProducts.length,
        whiskey: whiskeyProducts.length
      });
      
      // Check if we got at least some data
      const totalProducts = alcoholProducts.length + wineProducts.length + 
                            beerProducts.length + foodProducts.length + whiskeyProducts.length;
      
      if (totalProducts === 0) {
        throw new Error("Couldn't load any product data from any source");
      }
      
    } catch (fetchError) {
      console.error('Error fetching product data:', fetchError);
      productsContainer.innerHTML = `
        <div style="text-align: center; color: red; padding: 20px;">
          <p>שגיאה בטעינת המוצרים</p>
          <p>פרטים: ${fetchError.message}</p>
          <p>אנא נסה לרענן את הדף או צור קשר עם התמיכה.</p>
          <button id="retry-button" style="padding: 8px 15px; margin-top: 10px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">נסה שוב</button>
        </div>
      `;
      
      // Add retry button functionality
      document.getElementById('retry-button')?.addEventListener('click', () => {
        window.location.reload();
      });
      
      return; // Stop execution but don't throw error to allow partial UI to work
    }

    // Combine all products
    allProducts = [...alcoholProducts, ...whiskeyProducts, ...wineProducts, ...beerProducts, ...foodProducts];

    console.log('Loaded products:', {
      all: allProducts.length,
      alcohol: alcoholProducts.length,
      wine: wineProducts.length,
      food: foodProducts.length
    });

    // Group products with same name but different variants
    groupProductsByName();

    // Populate filter options
    populateFilters();

    // Display products
    displayProducts();

    // Add event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error loading products:', error);
    productsContainer.innerHTML = '<p style="text-align: center; color: red;">Error loading products. Please try again later.</p>';
  }
}

// Load brands from CSV file and populate the dropdown
async function loadBrands() {
  try {
    console.log('Loading brands from CSV...');
    
    // Add default option first
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'כל הלקוחות';
    brandFilter.appendChild(defaultOption);
    
    try {
      // Try to fetch brands from current directory
      const response = await fetch('brands.csv');
      
      if (response.ok) {
        const text = await response.text();
        console.log('Successfully loaded brands.csv');
        
        // Parse the CSV to extract brand names
        const lines = text.split('\n').filter(line => line.trim());
        brands = lines.map(line => line.trim());
        console.log('Loaded brands:', brands.length);
        
        // Sort brands alphabetically
        const sortedBrands = [...brands].sort((a, b) => a.localeCompare(b, 'he'));
        
        // Add all brand options
        sortedBrands.forEach(brand => {
          const option = document.createElement('option');
          option.value = brand;
          option.textContent = brand;
          brandFilter.appendChild(option);
        });
        
        console.log('Brand dropdown populated with', sortedBrands.length, 'options');
      } else {
        throw new Error(`HTTP status: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.warn('Error loading brands from CSV, using hardcoded brands from the alcohol CSV:', fetchError);
      
      // If we can't load the brands file, extract them from the column headers in the alcohol CSV
      // We'll use this as a fallback
      try {
        const alcoholResponse = await fetch(LOCAL_ALCOHOL_CSV);
        if (alcoholResponse.ok) {
          const csvText = await alcoholResponse.text();
          const firstLine = csvText.split('\n')[0];
          const headers = firstLine.split(',');
          
          // Extract client names (from column 4 onward, just before 'שם פריט אוטומטי')
          const clientNames = [];
          for (let i = 3; i < headers.length; i++) {
            const header = headers[i].trim();
            if (header === 'שם פריט אוטומטי') break;
            if (header) clientNames.push(header);
          }
          
          // Sort and add to dropdown
          const sortedClients = [...clientNames].sort((a, b) => a.localeCompare(b, 'he'));
          brands = sortedClients;
          
          sortedClients.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
          });
          
          console.log('Brand dropdown populated with', sortedClients.length, 'options from alcohol CSV');
        } else {
          throw new Error('Failed to load fallback file');
        }
      } catch (fallbackError) {
        console.error('Both brand sources failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error loading brands:', error);
    // Populate dropdown with empty message
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = 'שגיאה בטעינת לקוחות';
    errorOption.disabled = true;
    brandFilter.appendChild(errorOption);
    
    // Set empty brands array
    brands = [];
  }
}

// Parse CSV text to array of objects
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());

  return lines.slice(1).filter(line => line.trim()).map(line => {
    // Handle quoted fields with commas
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add the last value

    // Create object with header keys
    const product = {};
    headers.forEach((header, index) => {
      product[header] = values[index] || '';
      // Clean quotes
      if (typeof product[header] === 'string') {
        product[header] = product[header].replace(/"/g, '');
      }
    });

    return product;
  });
}

// Group products with the same name
function groupProductsByName() {
  groupedProducts = {};

  allProducts.forEach(product => {
    if (!product['שם פריט אוטומטי']) return;

    // Create key using name and company
    const key = getProductGroupKey(product);

    if (!groupedProducts[key]) {
      groupedProducts[key] = {
        mainProduct: product,
        variants: []
      };
    } else {
      groupedProducts[key].variants.push(product);
    }
  });
}

// Populate filter dropdowns
function populateFilters() {
  // Clear existing options except the default ones
  countryFilter.innerHTML = '<option value="">כל הארצות</option>';
  categoryFilter.innerHTML = '<option value="">כל הקטגוריות</option>';

  // Get products based on current tab
  const products = getProductsByTab();

  // Get unique countries and categories
  const countries = [...new Set(products.filter(p => p['מדינה']).map(p => p['מדינה']))];
  const categories = [...new Set(products.filter(p => p['קטגוריה אוטומטי'] || p['קטגוריה']).map(p => p['קטגוריה אוטומטי'] || p['קטגוריה']))];

  // Sort alphabetically
  countries.sort();
  categories.sort();

  // Add to country filter
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countryFilter.appendChild(option);
  });

  // Add to category filter
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Update brand filter button status
  updateBrandFilterButtonStatus();
}

// Update select styling based on selection
function updateSelectStyling(selectElement) {
  if (selectElement.value) {
    selectElement.classList.add('has-value');
  } else {
    selectElement.classList.remove('has-value');
  }
}

// Get products based on the current tab
function getProductsByTab() {
  switch (currentFilters.tab) {
    case 'alcohol':
      return alcoholProducts && alcoholProducts.length > 0 ? alcoholProducts : allProducts;
    case 'whiskey':
      return whiskeyProducts && whiskeyProducts.length > 0 ? whiskeyProducts : allProducts;
    case 'wine':
      return wineProducts && wineProducts.length > 0 ? wineProducts : allProducts;
    case 'beer':
      return beerProducts && beerProducts.length > 0 ? beerProducts : allProducts;
    case 'food':
      return foodProducts && foodProducts.length > 0 ? foodProducts : allProducts;
    default:
      return allProducts;
  }
}

// Filter products based on current filters
function getFilteredProducts() {
  const products = getProductsByTab();

  return products.filter(product => {
    // Country filter
    if (currentFilters.country && product['מדינה'] !== currentFilters.country) {
      return false;
    }

    // Category filter
    const productCategory = product['קטגוריה אוטומטי'] || product['קטגוריה'];
    if (currentFilters.category && productCategory !== currentFilters.category) {
      return false;
    }

    // Brand filter
    if (currentFilters.brand && !product[currentFilters.brand]) {
      return false;
    }

    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const nameMatch = product['שם פריט אוטומטי'] && product['שם פריט אוטומטי'].toLowerCase().includes(searchLower);
      const descMatch = product['תאור'] && product['תאור'].toLowerCase().includes(searchLower);
      const companyMatch = (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי']) &&
          (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי']).toLowerCase().includes(searchLower);
      const barcodeMatch = product['ברקוד'] && product['ברקוד'].toLowerCase().includes(searchLower);

      if (!(nameMatch || descMatch || companyMatch || barcodeMatch)) {
        return false;
      }
    }

    return true;
  });
}

// Display products based on current filters
function displayProducts() {
  const filteredProducts = getFilteredProducts();

  // Clear container
  productsContainer.innerHTML = '';

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = '<p style="text-align: center;">לא נמצאו מוצרים התואמים את החיפוש שלך.</p>';
    return;
  }

  // Track displayed groups to avoid duplicates
  const displayedGroups = new Set();

  filteredProducts.forEach(product => {
    // Skip if we've already shown this product group
    const groupKey = getProductGroupKey(product);
    if (groupKey && displayedGroups.has(groupKey)) return;

    // Create product card
    const card = createProductCard(product);
    productsContainer.appendChild(card);

    // Mark this group as displayed
    if (groupKey) displayedGroups.add(groupKey);
  });
}

// Get product group key
function getProductGroupKey(product) {
  if (!product['שם פריט אוטומטי']) return null;

  const company = product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || '';

  return company
      ? `${product['שם פריט אוטומטי'].trim().toLowerCase()}_${company.trim().toLowerCase()}`
      : product['שם פריט אוטומטי'].trim().toLowerCase();
}

// Create product card element
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  // Get image URL based on barcode
  const barcode = product['ברקוד'];
  const imageUrl = barcode ? `tl/${barcode}.jpg` : 'placeholder.jpg';

  // Determine kosher status and class
  const isKosher = product['כשרות'] && product['כשרות'].toLowerCase() === 'כשר';
  const kosherStatusClass = isKosher ? 'kosher-yes' : 'kosher-no';
  const kosherText = isKosher ? 'כשר' : 'לא כשר';

  // Get company/brand name
  const company = product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || '';

  // Get volume/weight
  const volumeWeight = product['נפח'] || product['משקל'] || '';

  // Get country code for flag (simple mapping for common countries)
  const countryToCode = {
    'ישראל': 'il',
    'איטליה': 'it',
    'צרפת': 'fr',
    'גרמניה': 'de',
    'ספרד': 'es',
    'ארה"ב': 'us',
    'בריטניה': 'gb',
    'סין': 'cn',
    'יפן': 'jp',
    'הודו': 'in',
    'ברזיל': 'br',
    'אוסטרליה': 'au',
    'קנדה': 'ca',
    'רוסיה': 'ru',
    'טורקיה': 'tr',
    'מולדובה': 'md',
    'גאורגיה': 'ge',
    'איחוד האמירויות': 'ae',
    'אוקראינה': 'ua',
    'פולין': 'pl',
    'בולגריה': 'bg',
    'גואטמאלה': 'gt',
    'מקסיקו': 'mx',
    'סנט לוסיה': 'lc',
    'קולומביה': 'co',
    'קאריבים': 'bs', // Using Bahamas as generic Caribbean flag
    'יוון': 'gr',
    'סקוטלנד': 'gb', // Using UK flag for Scotland
    'מלטה': 'mt',
    'קניה': 'ke',
    'סלובניה': 'si'
  };

  const countryCode = product['מדינה'] && countryToCode[product['מדינה']] ? countryToCode[product['מדינה']] : '';

  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${product['שם פריט אוטומטי'] || 'Product'}" onerror="if(this.src.includes('tl/')){ this.src='media/${barcode || ''}.jpg'; } else if(this.src.includes('media/')){ this.src='placeholder.jpg'; this.nextElementSibling.style.display='block'; }">
      <div class="image-not-found">image not found</div>
    </div>
    <div class="product-info">
      <h3>${product['שם פריט אוטומטי'] || 'Unnamed Product'}</h3>
      ${company ? `<div class="product-company">${company}</div>` : ''}
      ${product['מדינה'] ? `<div class="product-country">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה']}</span>
      </div>` : ''}
      <div><span class="kosher-status ${kosherStatusClass}">${kosherText}</span></div>
      ${product['תאור'] ? `<div class="product-description">${product['תאור']}</div>` : ''}
      ${volumeWeight ? `<div class="product-volume">${volumeWeight}</div>` : ''}
      <div class="product-details">
        <span class="barcode">${product['ברקוד'] || ''}</span>
        ${product['מחיר'] ? `<span class="price">${product['מחיר']} ₪</span>` : ''}
      </div>
    </div>
  `;

  // Add click event to open modal
  card.addEventListener('click', () => openProductModal(product));

  return card;
}

// Open product modal
function openProductModal(product) {
  const groupKey = getProductGroupKey(product);
  const group = groupedProducts[groupKey];

  // Get company/brand name
  const company = product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || '';

  // Set modal content
  modalTitle.textContent = product['שם פריט אוטומטי'] || 'Unnamed Product';
  modalCompany.textContent = company;
  modalDescription.textContent = product['תאור'] || '';

  // Set image - use tl folder for modal (same as the cards)
  const barcode = product['ברקוד'];
  const imageUrl = barcode ? `tl/${barcode}.jpg` : 'placeholder.jpg';
  modalImage.src = imageUrl;
  modalImage.alt = product['שם פריט אוטומטי'] || 'Product';

  // Reset the image not found message
  document.querySelector('.modal-image-not-found').style.display = 'none';

  // Handle image error - try alternative folders before showing error
  modalImage.onerror = function() {
    if (this.src.includes('tl/')) {
      // If tl/ folder failed, try media/ folder
      this.src = `media/${barcode}.jpg`;
    } else if (this.src.includes('media/')) {
      // If media/ folder also failed, use placeholder and show error
      this.src = 'placeholder.jpg';
      document.querySelector('.modal-image-not-found').style.display = 'block';
    }
  };

  // Clear specs and variants
  modalSpecs.innerHTML = '';
  modalVariants.innerHTML = '';

  // Add kosher status to specs
  if (product['כשרות'] !== undefined) {
    const isKosher = product['כשרות'] && product['כשרות'].toLowerCase() === 'כשר';
    const kosherStatusClass = isKosher ? 'kosher-yes' : 'kosher-no';
    const kosherText = isKosher ? 'כשר' : 'לא כשר';

    const kosherSpec = document.createElement('div');
    kosherSpec.className = 'spec-item kosher-spec';
    kosherSpec.innerHTML = `
      <div class="spec-label">כשרות:</div>
      <div class="spec-value"><span class="kosher-status ${kosherStatusClass}">${kosherText}</span></div>
    `;
    modalSpecs.appendChild(kosherSpec);
  }

  // Add country with flag to specs
  if (product['מדינה']) {
    const countryToCode = {
      'ישראל': 'il',
      'איטליה': 'it',
      'צרפת': 'fr',
      'גרמניה': 'de',
      'ספרד': 'es',
      'ארה"ב': 'us',
      'בריטניה': 'gb',
      'סין': 'cn',
      'יפן': 'jp',
      'הודו': 'in',
      'ברזיל': 'br',
      'אוסטרליה': 'au',
      'קנדה': 'ca',
      'רוסיה': 'ru',
      'טורקיה': 'tr',
      'מולדובה': 'md',
      'גאורגיה': 'ge',
      'איחוד האמירויות': 'ae',
      'אוקראינה': 'ua',
      'פולין': 'pl',
      'בולגריה': 'bg',
      'גואטמאלה': 'gt',
      'מקסיקו': 'mx',
      'סנט לוסיה': 'lc',
      'קולומביה': 'co',
      'קאריבים': 'bs', // Using Bahamas as generic Caribbean flag
      'יוון': 'gr',
      'סקוטלנד': 'gb', // Using UK flag for Scotland
      'מלטה': 'mt',
      'קניה': 'ke',
      'סלובניה': 'si'
    };

    const countryCode = countryToCode[product['מדינה']] || '';
    const countrySpec = document.createElement('div');
    countrySpec.className = 'spec-item country-spec';
    countrySpec.innerHTML = `
      <div class="spec-label">מדינת ייצור:</div>
      <div class="spec-value">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה']}</span>
      </div>
    `;
    modalSpecs.appendChild(countrySpec);
  }

  // Add stocked in brands section
  const productBrands = [];
  for (const brand of brands) {
    if (product[brand] && product[brand].toLowerCase() === 'true') {
      productBrands.push(brand);
    }
  }

  if (productBrands.length > 0) {
    const brandsSpec = document.createElement('div');
    brandsSpec.className = 'spec-item brands-spec';
    brandsSpec.innerHTML = `
      <div class="spec-label">נמצא אצל:</div>
      <div class="spec-value">${productBrands.join(', ')}</div>
    `;
    modalSpecs.appendChild(brandsSpec);
  }

  // Add product specs
  for (const [key, value] of Object.entries(product)) {
    // Skip empty values, brands, and fields displayed elsewhere
    if (!value || 
        key === 'שם פריט אוטומטי' || 
        key === 'תאור' || 
        key === 'כשרות' || 
        key === 'מדינה' ||
        key === 'company' || 
        key === 'קבוצה / מותג' || 
        key === 'קבוצה / מותג אוטומטי' ||
        brands.includes(key)) continue;

    const specItem = document.createElement('div');
    specItem.className = 'spec-item';

    specItem.innerHTML = `
      <div class="spec-label">${key}:</div>
      <div class="spec-value">${value}</div>
    `;

    modalSpecs.appendChild(specItem);
  }

  // Add variants if available
  if (group && group.variants.length > 0) {
    const allVariants = [group.mainProduct, ...group.variants];

    allVariants.forEach(variant => {
      const variantOption = document.createElement('div');
      variantOption.className = 'variant-option';
      if (variant === product) variantOption.classList.add('active');

      const variantLabel = variant['נפח'] || variant['משקל'] || 'Standard';

      variantOption.textContent = variantLabel;

      variantOption.addEventListener('click', () => {
        openProductModal(variant);
      });

      modalVariants.appendChild(variantOption);
    });
  }

  // Show modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent scrolling of the background
}

// Close product modal
function closeProductModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Enable scrolling on body again
}

// These functions are no longer needed since we're using a dropdown instead of a modal

// Switch tab
function switchTab(tabName) {
  // Update active tab button
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update current tab
  currentFilters.tab = tabName;

  // Reset other filters
  currentFilters.country = '';
  currentFilters.category = '';
  currentFilters.brand = '';
  countryFilter.value = '';
  categoryFilter.value = '';
  brandFilter.value = '';
  
  // Reset styling
  updateSelectStyling(countryFilter);
  updateSelectStyling(categoryFilter);
  updateSelectStyling(brandFilter);

  // Update filter options based on the new tab
  populateFilters();

  // Display filtered products
  displayProducts();
}

// Perform search (triggered by button click)
function performSearch() {
  currentFilters.search = searchInput.value;
  displayProducts();
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Skip if this tab is disabled
      if (btn.classList.contains('disabled')) {
        return;
      }
      
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // Filter change events
  countryFilter.addEventListener('change', function() {
    currentFilters.country = this.value;
    updateSelectStyling(this);
    displayProducts();
  });

  categoryFilter.addEventListener('change', function() {
    currentFilters.category = this.value;
    updateSelectStyling(this);
    displayProducts();
  });
  
  brandFilter.addEventListener('change', function() {
    currentFilters.brand = this.value;
    updateSelectStyling(this);
    displayProducts();
  });

  // Search button click
  searchBtn.addEventListener('click', performSearch);
  
  // Search input enter key
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Search input with debounce
  searchInput.addEventListener('input', function() {
    clearTimeout(this.debounceTimer);
    const value = this.value;

    this.debounceTimer = setTimeout(() => {
      currentFilters.search = value;
      displayProducts();
    }, 300);
  });

  // Close modal events
  closeModalBtn.addEventListener('click', closeProductModal);

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeProductModal();
    }
  });

  // Prevent modal content clicks from closing the modal
  document.querySelector('.modal-content').addEventListener('click', function(event) {
    event.stopPropagation();
  });
  
  document.querySelector('#brand-filter-modal .modal-content').addEventListener('click', function(event) {
    event.stopPropagation();
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (modal.style.display === 'block') {
        closeProductModal();
      }
      if (brandFilterModal.style.display === 'block') {
        closeBrandFilterModal();
      }
    }
  });
}