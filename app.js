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
  brand: '', // Client filter
  brandGroup: '', // Generic brand/group filter for all categories
  kosher: '', // Kosher filter 
  isNew: false // Filter for new products
};

// Detect if we're on the new products page
const isNewProductsPage = window.location.pathname.includes('new-products.html');
// Set isNew filter if we're on the new products page
if (isNewProductsPage) {
  currentFilters.isNew = true;
}

// DOM elements
const countryFilter = document.getElementById('country-filter');
const categoryFilter = document.getElementById('category-filter');
const brandFilter = document.getElementById('brand-filter');
const brandGroupFilter = document.getElementById('brand-group-filter');
const kosherFilter = document.getElementById('kosher-filter');
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
const clearCountryFilterBtn = document.getElementById('clear-country-filter');
const clearCategoryFilterBtn = document.getElementById('clear-category-filter');
const clearBrandFilterBtn = document.getElementById('clear-brand-filter');
const clearBrandGroupFilterBtn = document.getElementById('clear-brand-group-filter');
const clearKosherFilterBtn = document.getElementById('clear-kosher-filter');

// CSV URLs for each product category
const ALCOHOL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv';
const WINE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv';
const BEER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv';
const FOOD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv';
const WHISKEY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv';
const BRANDS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbLyJcDTPOjBtcGOSKUXYuKn5U8_sRF_KOSgFwiyPoeO3YazAxOhXXVCSK7M94-yxyO7j1fr5J3ou_/pub?output=csv';

// We're only using remote data now, no local fallbacks

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
      
      // Simplified helper function to fetch a specific category with multiple fallback options
      async function fetchCategory(name, remoteUrl) {
        console.log(`Fetching ${name} data from ${remoteUrl}`);
        
        try {
          // First try using the direct URL with fetch
          try {
            console.log(`Trying direct fetch for ${name}...`);
            const response = await fetch(remoteUrl);
            
            if (response.ok) {
              const text = await response.text();
              const data = parseCSV(text);
              console.log(`Successfully fetched ${name} directly, rows:`, data.length);
              return data;
            }
          } catch (directError) {
            console.warn(`Direct fetch for ${name} failed:`, directError);
          }
          
          // Second try: use XMLHttpRequest (works around some CORS issues)
          try {
            console.log(`Trying XMLHttpRequest for ${name}...`);
            const xhrResult = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', remoteUrl, true);
              xhr.responseType = 'text';
              
              xhr.onload = function() {
                if (xhr.status === 200) {
                  try {
                    const data = parseCSV(xhr.responseText);
                    console.log(`Successfully fetched ${name} via XHR, rows:`, data.length);
                    resolve(data);
                  } catch (parseError) {
                    reject(parseError);
                  }
                } else {
                  reject(new Error(`HTTP error: ${xhr.status}`));
                }
              };
              
              xhr.onerror = () => reject(new Error('Network error'));
              xhr.ontimeout = () => reject(new Error('Timeout'));
              xhr.timeout = 10000;
              xhr.send();
            });
            
            return xhrResult;
          } catch (xhrError) {
            console.warn(`XMLHttpRequest for ${name} failed:`, xhrError);
          }
          
          // Third try: use a PHP proxy if it exists
          try {
            console.log(`Trying PHP proxy for ${name}...`);
            const proxyUrl = `proxy.php?url=${encodeURIComponent(remoteUrl)}`;
            const proxyResponse = await fetch(proxyUrl);
            
            if (proxyResponse.ok) {
              const text = await proxyResponse.text();
              const data = parseCSV(text);
              console.log(`Successfully fetched ${name} via proxy, rows:`, data.length);
              return data;
            }
          } catch (proxyError) {
            console.warn(`Proxy fetch for ${name} failed:`, proxyError);
          }
          
          // If all else fails, return empty array
          console.error(`All fetch methods failed for ${name}`);
          return [];
        } catch (error) {
          console.error(`Failed to fetch ${name} data:`, error);
          
          // No more fallback data
          
          // Return empty array on complete failure
          return [];
        }
      }
      
      // Fetch all categories in parallel - remote only
      const results = await Promise.allSettled([
        fetchCategory('alcohol', ALCOHOL_CSV_URL),
        fetchCategory('wine', WINE_CSV_URL),
        fetchCategory('beer', BEER_CSV_URL),
        fetchCategory('food', FOOD_CSV_URL),
        fetchCategory('whiskey', WHISKEY_CSV_URL)
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
      
      // Debug: check for products without essential fields
      const debugWhiskey = whiskeyProducts.filter(p => !p['שם פריט אוטומטי'] && !p['תיאור פריט']);
      if (debugWhiskey.length > 0) {
        console.warn(`Found ${debugWhiskey.length} whiskey products without a name or description`);
        console.log('Sample invalid whiskey product:', debugWhiskey[0]);
      }
      
      const debugAlcohol = alcoholProducts.filter(p => !p['שם פריט אוטומטי'] && !p['תיאור פריט']);
      if (debugAlcohol.length > 0) {
        console.warn(`Found ${debugAlcohol.length} alcohol products without a name or description`);
        console.log('Sample invalid alcohol product:', debugAlcohol[0]);
      }
      
      // Check if we got at least some data
      const totalProducts = alcoholProducts.length + wineProducts.length + 
                            beerProducts.length + foodProducts.length + whiskeyProducts.length;
      
      if (totalProducts === 0) {
        console.error("Failed to load any product data");
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

    // Initialize all products and prepare them for filtering
    const allProductsForFiltering = [...allProducts];
    
    // Update all filters with dynamically filtered options
    updateFilterOptions(allProductsForFiltering);
    
    // Handle brand filter visibility based on user role - only show for admin and agent roles
    const brandFilterContainer = brandFilter.closest('.filter-group');
    if (brandFilterContainer) {
      // Only show for ADMIN and AGENT role users, hide for all others
      if (window.userRole === USER_ROLES.ADMIN || window.userRole === USER_ROLES.AGENT) {
        brandFilterContainer.style.display = '';
      } else {
        brandFilterContainer.style.display = 'none';
      }
    }
    
    // Initialize the data-open attribute for all filters
    const filters = [countryFilter, categoryFilter, brandFilter, brandGroupFilter, kosherFilter];
    filters.forEach(filter => {
      filter.setAttribute('data-open', 'false');
    });

    // Display products
    displayProducts();

    // Add event listeners
    setupEventListeners();
    
    // Update cart count if user is client
    if (window.userRole === USER_ROLES.CLIENT) {
      updateCartCount();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    productsContainer.innerHTML = '<p style="text-align: center; color: red;">Error loading products. Please try again later.</p>';
  }
}

// Load brands directly from Google Sheets and populate the dropdown
async function loadBrands() {
  try {
    console.log('Loading brands from Google Sheets...');
    
    // Add default option first
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'כל הלקוחות';
    brandFilter.appendChild(defaultOption);
    
    // Try using direct fetch from Google Sheets
    console.log('Trying direct fetch for brands from:', BRANDS_CSV_URL);
    
    try {
      const response = await fetchWithTimeout(BRANDS_CSV_URL, 10000);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Successfully loaded brands from Google Sheets');
        
        // Parse the CSV to extract brand names
        const lines = text.split('\n').filter(line => line.trim());
        brands = lines.map(line => line.trim().normalize('NFKC').replace(/\s+/g, ' '));
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
        return; // Successfully loaded brands
      } else {
        throw new Error(`HTTP status: ${response.status} ${response.statusText}`);
      }
    } catch (directError) {
      console.warn('Direct fetch for brands failed:', directError);
      
      // Second try: use XMLHttpRequest (works around some CORS issues)
      try {
        console.log('Trying XMLHttpRequest for brands...');
        const xhrResult = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', BRANDS_CSV_URL, true);
          xhr.responseType = 'text';
          
          xhr.onload = function() {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject(new Error(`HTTP error: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.ontimeout = () => reject(new Error('Timeout'));
          xhr.timeout = 10000;
          xhr.send();
        });
        
        const lines = xhrResult.split('\n').filter(line => line.trim());
        brands = lines.map(line => line.trim().normalize('NFKC').replace(/\s+/g, ' '));
        console.log('Loaded brands via XHR:', brands.length);
        
        // Sort and add to dropdown
        const sortedBrands = [...brands].sort((a, b) => a.localeCompare(b, 'he'));
        
        sortedBrands.forEach(brand => {
          const option = document.createElement('option');
          option.value = brand;
          option.textContent = brand;
          brandFilter.appendChild(option);
        });
        
        console.log('Brand dropdown populated with', sortedBrands.length, 'options');
        return; // Successfully loaded brands
      } catch (xhrError) {
        console.warn('XMLHttpRequest for brands failed:', xhrError);
        
        // Third try: use a PHP proxy if it exists
        try {
          console.log('Trying PHP proxy for brands...');
          const proxyUrl = `proxy.php?url=${encodeURIComponent(BRANDS_CSV_URL)}`;
          const proxyResponse = await fetch(proxyUrl);
          
          if (proxyResponse.ok) {
            const text = await proxyResponse.text();
            const lines = text.split('\n').filter(line => line.trim());
            brands = lines.map(line => line.trim().normalize('NFKC').replace(/\s+/g, ' '));
            console.log('Loaded brands via proxy:', brands.length);
            
            // Sort and add to dropdown
            const sortedBrands = [...brands].sort((a, b) => a.localeCompare(b, 'he'));
            
            sortedBrands.forEach(brand => {
              const option = document.createElement('option');
              option.value = brand;
              option.textContent = brand;
              brandFilter.appendChild(option);
            });
            
            console.log('Brand dropdown populated with', sortedBrands.length, 'options via proxy');
            return; // Successfully loaded brands
          } else {
            throw new Error('Proxy request failed');
          }
        } catch (proxyError) {
          console.warn('Proxy fetch for brands failed:', proxyError);
          throw proxyError; // Let the outer catch handle it
        }
      }
    }
  } catch (error) {
    console.error('Error loading brands:', error);
    // Show clear error message
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = 'שגיאה בטעינת לקוחות - נסה לרענן את הדף';
    errorOption.disabled = true;
    brandFilter.appendChild(errorOption);
    
    // Add retry button to header
    const header = document.querySelector('header');
    if (header) {
      const retryButton = document.createElement('button');
      retryButton.textContent = 'נסה לטעון לקוחות שוב';
      retryButton.className = 'retry-button';
      retryButton.style.margin = '10px auto';
      retryButton.style.display = 'block';
      retryButton.addEventListener('click', () => {
        // Clear current options
        while (brandFilter.options.length > 0) {
          brandFilter.remove(0);
        }
        // Try loading again
        loadBrands();
      });
      header.appendChild(retryButton);
    }
    
    // Set empty brands array
    brands = [];
  }
}

// Parse CSV text to array of objects
function parseCSV(csvText) {
  // Remove potential BOM character
  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.slice(1);
  }

  const lines = csvText.split('\n');
  // Don't lowercase headers - preserve original case
  const headers = lines[0].split(',').map(header => header.trim());

  // Debug: Log all headers to see what columns we have
  console.log('CSV Headers:', headers);
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
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
        // Normalize the header to handle encoding issues
        const normalizedHeader = header.normalize('NFKC').replace(/\s+/g, ' ');
        product[normalizedHeader] = values[index] || '';
        // Clean quotes
        if (typeof product[normalizedHeader] === 'string') {
          product[normalizedHeader] = product[normalizedHeader].replace(/"/g, '');
        }
      });

      return product;
    })
    .filter(product => {
      // Filter out invalid products that don't have essential data
      // A product must have at least a name (from either field) to be valid
      return (product['שם פריט אוטומטי'] && product['שם פריט אוטומטי'].trim() !== '') || 
             (product['תיאור פריט'] && product['תיאור פריט'].trim() !== '');
    });
}

// Group products with the same name
function groupProductsByName() {
  groupedProducts = {};

  allProducts.forEach(product => {
    // Allow products without 'שם פריט אוטומטי' if they have 'תיאור פריט' (especially for whiskey)
    if (!product['שם פריט אוטומטי'] && !product['תיאור פריט']) return;

    // Create key using name and company
    const key = getProductGroupKey(product);
    
    if (!key) return; // Skip if no valid key could be created

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
function populateFilters(excludeFilter = '') {
  console.log(`Populating filters with excludeFilter: ${excludeFilter}`);
  console.log('Current filters:', JSON.stringify(currentFilters, null, 2));
  
  // Get products based on current tab
  let products = getProductsByTab();
  
  // If any filters are applied, filter products for dynamic filters
  if (currentFilters.country || currentFilters.category || 
      currentFilters.brandGroup || currentFilters.kosher || 
      currentFilters.search || currentFilters.brand || 
      currentFilters.isNew) {
    
    // Apply current filters excluding the one being updated
    products = getDynamicallyFilteredProducts(products, excludeFilter);
    console.log(`After dynamic filtering, remaining products: ${products.length}`);
  }

  // Clear existing options except the default ones
  countryFilter.innerHTML = '<option value="">כל הארצות</option>';
  
  // Set category placeholder text based on tab
  let categoryPlaceholder = 'כל הקטגוריות';
  if (currentFilters.tab === 'alcohol') {
    categoryPlaceholder = 'כל הסוגים';
  }
  categoryFilter.innerHTML = `<option value="">${categoryPlaceholder}</option>`;
  
  // Set brand filter placeholder to always show it's for clients
  const brandPlaceholder = 'כל הלקוחות';
  
  // Reset brand filter completely when it's the excluded filter
  if (excludeFilter === 'brand-filter') {
    brandFilter.innerHTML = `<option value="">${brandPlaceholder}</option>`;
  } else {
    // Just update the placeholder if not excluded
    const brandFilterOptions = brandFilter.querySelectorAll('option');
    if (brandFilterOptions.length > 0) {
      brandFilterOptions[0].textContent = brandPlaceholder;
    }
  }
  
  // Get unique countries and categories from filtered products
  const countries = [...new Set(products.filter(p => p['מדינה']).map(p => p['מדינה']))];
  const categories = [...new Set(products.filter(p => p['קטגוריה אוטומטי'] || p['קטגוריה']).map(p => p['קטגוריה אוטומטי'] || p['קטגוריה']))];

  // Get unique brand groups based on product category
  let brandGroups = [];
  
  // Get brand/group values based on the current tab
  if (currentFilters.tab === 'wine') {
    brandGroups = [...new Set(products.filter(p => p['קבוצה / מותג']).map(p => p['קבוצה / מותג']))];
  } else if (currentFilters.tab === 'whiskey') {
    brandGroups = [...new Set(products.filter(p => p['מותג']).map(p => p['מותג']))];
  } else if (currentFilters.tab === 'all') {
    if (currentFilters.country || currentFilters.category || 
        currentFilters.brandGroup || currentFilters.kosher || 
        currentFilters.search) {
      
      const filteredWineGroups = [...new Set(products.filter(p => p['קבוצה / מותג']).map(p => p['קבוצה / מותג']))];
      const filteredWhiskeyGroups = [...new Set(products.filter(p => p['מותג']).map(p => p['מותג']))];
      const filteredOtherGroups = [...new Set(products.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
      
      brandGroups = [...new Set([...filteredWineGroups, ...filteredWhiskeyGroups, ...filteredOtherGroups])];
    } else {
      const wineGroups = [...new Set(wineProducts.filter(p => p['קבוצה / מותג']).map(p => p['קבוצה / מותג']))];
      const whiskeyGroups = [...new Set(whiskeyProducts.filter(p => p['מותג']).map(p => p['מותג']))];
      const alcoholGroups = [...new Set(alcoholProducts.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
      const beerGroups = [...new Set(beerProducts.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
      const foodGroups = [...new Set(foodProducts.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
      
      brandGroups = [...new Set([...wineGroups, ...whiskeyGroups, ...alcoholGroups, ...beerGroups, ...foodGroups])];
    }
  } else {
    brandGroups = [...new Set(products.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
  }

  // Sort alphabetically
  countries.sort();
  categories.sort();
  brandGroups.sort();

  // Add to country filter
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    
    // Preserve current selection if it exists in the filtered results
    if (country === currentFilters.country) {
      option.selected = true;
    }
    
    countryFilter.appendChild(option);
  });

  // Add to category filter
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    
    // Preserve current selection if it exists in the filtered results
    if (category === currentFilters.category) {
      option.selected = true;
    }
    
    categoryFilter.appendChild(option);
  });
  
  // Dynamically update the brand (client) filter based on filtered products if it's not the one being excluded
  if (excludeFilter !== 'brand-filter') {
    // Extract all available client names from product fields
    const availableClients = [];
    
    // For each product, check all fields that might be client indicators
    products.forEach(product => {
      // Check each product field
      Object.keys(product).forEach(key => {
        // Look for columns that are TRUE and might be client names
        if (product[key] && product[key].toString().toUpperCase() === 'TRUE') {
          if (!key.startsWith('מק"ט') && !key.includes('ברקוד') && 
              !key.includes('קטגוריה') && !key.includes('תיאור') && 
              !key.includes('שם פריט') && !key.includes('מחיר') && 
              !key.includes('כשרות')) {
            // This might be a client column
            if (!availableClients.includes(key)) {
              availableClients.push(key);
            }
          }
        }
      });
    });
    
    // Sort clients alphabetically
    availableClients.sort((a, b) => a.localeCompare(b, 'he'));
    
    // Preserve current selection
    const currentClientSelection = brandFilter.value;
    
    // Add all available clients to the filter
    availableClients.forEach(client => {
      // Skip if already in dropdown
      let exists = false;
      for (const option of brandFilter.options) {
        if (option.value === client) {
          exists = true;
          break;
        }
      }
      
      if (!exists) {
        const option = document.createElement('option');
        option.value = client;
        option.textContent = client;
        
        // Preserve current selection if it exists in the filtered results
        if (client === currentFilters.brand) {
          option.selected = true;
        }
        
        brandFilter.appendChild(option);
      }
    });
    
    // Restore the selection if it exists in available options
    if (currentClientSelection) {
      for (const option of brandFilter.options) {
        if (option.value === currentClientSelection) {
          option.selected = true;
          break;
        }
      }
    }
  }

  // Populate brand group filter
  brandGroupFilter.innerHTML = '<option value="">קבוצה/מותג</option>';
  
  // Add brand group options
  brandGroups.forEach(group => {
    if (group && group.trim() !== '') {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group;
      
      // Preserve current selection if it exists in the filtered results
      if (group === currentFilters.brandGroup) {
        option.selected = true;
      }
      
      brandGroupFilter.appendChild(option);
    }
  });

  // Hide kosher filter for whiskey tab
  const kosherFilterContainer = kosherFilter.closest('.filter-group');
  if (kosherFilterContainer) {
    if (currentFilters.tab === 'whiskey') {
      kosherFilterContainer.style.display = 'none';
    } else {
      kosherFilterContainer.style.display = '';
    }
  }
  
  // Update select styling
  updateSelectStyling(countryFilter);
  updateSelectStyling(categoryFilter);
  updateSelectStyling(brandFilter);
  updateSelectStyling(brandGroupFilter);
  updateSelectStyling(kosherFilter);
  
  // Update filter states
  updateFilterStates();
}

// Helper function to get filtered products for dynamic filters
function getDynamicallyFilteredProducts(products, excludeFilter) {
  console.log(`getDynamicallyFilteredProducts called with ${products.length} products, excludeFilter: ${excludeFilter}`);
  
  // Log current filters to help with debugging
  console.log('Current filters:', JSON.stringify(currentFilters));
  
  return products.filter(product => {
    // Country filter - skip if this is the filter being updated
    if (excludeFilter !== 'country-filter' && currentFilters.country && product['מדינה'] !== currentFilters.country) {
      return false;
    }

    // Category filter - skip if this is the filter being updated
    if (excludeFilter !== 'category-filter' && currentFilters.category) {
      const productCategory = product['קטגוריה אוטומטי'] || product['קטגוריה'];
      if (productCategory !== currentFilters.category) {
        return false;
      }
    }

    // Brand Group filter - skip if this is the filter being updated
    if (excludeFilter !== 'brand-group-filter' && currentFilters.brandGroup) {
      // Determine product type for selecting the correct field
      let productType = '';
      if (whiskeyProducts.includes(product)) {
        productType = 'whiskey';
      } else if (wineProducts.includes(product)) {
        productType = 'wine';
      } else if (beerProducts.includes(product)) {
        productType = 'beer';
      } else if (foodProducts.includes(product)) {
        productType = 'food';
      } else if (alcoholProducts.includes(product)) {
        productType = 'alcohol';
      }
      
      // Get brand/group field based on product type
      let productBrandGroup = '';
      
      if (productType === 'wine') {
        productBrandGroup = product['קבוצה / מותג'] || '';
      } else if (productType === 'whiskey') {
        productBrandGroup = product['מותג'] || '';
      } else {
        // For alcohol, beer, food, and all others
        productBrandGroup = product['קבוצה / מותג אוטומטי'] || '';
      }
      
      if (productBrandGroup !== currentFilters.brandGroup) {
        return false;
      }
    }
    
    // Client/Brand filter - skip if this is the filter being updated
    if (excludeFilter !== 'brand-filter' && currentFilters.brand) {
      // Normalize the client name
      const normalizedClientName = currentFilters.brand.normalize('NFKC');
      
      // Create aliases for common mixed-language client names
      const clientAliases = {
        'AM-PM': ['אלונית (AM-PM)', 'ampm', 'am-pm', 'אמפמ', 'אלונית'],
        'אלונית': ['אלונית (AM-PM)', 'alonit', 'AM-PM', 'ampm'],
        // Add other known aliases as needed
      };
      
      const aliases = clientAliases[normalizedClientName] || [];
      
      // Check for the client name or any of its aliases
      let clientMatch = false;
      
      // First check the exact client name
      if (product[normalizedClientName] && 
          product[normalizedClientName].toString().toUpperCase() === 'TRUE') {
        clientMatch = true;
      } else {
        // Then check all possible aliases
        for (const alias of aliases) {
          if (product[alias] && product[alias].toString().toUpperCase() === 'TRUE') {
            clientMatch = true;
            break;
          }
        }
        
        // If still no match, check for partial matches (for cases like partial client names)
        if (!clientMatch) {
          for (const key of Object.keys(product)) {
            if ((key.includes(normalizedClientName) || normalizedClientName.includes(key)) &&
                product[key].toString().toUpperCase() === 'TRUE') {
              clientMatch = true;
              break;
            }
          }
        }
      }
      
      if (!clientMatch) return false;
    }
    
    // Kosher filter - skip if this is the filter being updated
    if (excludeFilter !== 'kosher-filter' && currentFilters.kosher && currentFilters.tab !== 'whiskey') {
      if (!product['כשרות']) {
        return false;
      }
      
      const kosherValue = product['כשרות'].toString().toLowerCase();
      
      if (currentFilters.kosher === 'true') {
        // Filter for kosher products
        if (kosherValue !== 'true' && kosherValue !== 'כן' && kosherValue !== 'כשר') {
          return false;
        }
      } else if (currentFilters.kosher === 'false') {
        // Filter for non-kosher products
        if (kosherValue !== 'false' && kosherValue !== 'לא' && kosherValue !== 'לא כשר') {
          return false;
        }
      }
    }

    // Search filter - skip if this is the filter being updated
    if (excludeFilter !== 'search-input' && currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const nameMatch = product['שם פריט אוטומטי'] && product['שם פריט אוטומטי'].toLowerCase().includes(searchLower);
      const descMatch = product['תאור'] && product['תאור'].toLowerCase().includes(searchLower);
      const companyMatch = (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג']) &&
          (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג']).toLowerCase().includes(searchLower);
      const barcodeMatch = product['ברקוד'] && product['ברקוד'].toLowerCase().includes(searchLower);

      if (!(nameMatch || descMatch || companyMatch || barcodeMatch)) {
        return false;
      }
    }
    
    // Filter by "IsNew" for new products page - always apply this if it's set
    if (currentFilters.isNew) {
      // Check for "IsNew" field - could be in different formats
      const isNewValue = product['IsNew'] || product['חדש'] || product['מוצר חדש'];
      if (!isNewValue || isNewValue.toString().toUpperCase() !== 'TRUE') {
        return false;
      }
    }
    
    return true;
  });
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
    // Client brand restrictions are no longer applied
    
    // Country filter
    if (currentFilters.country && product['מדינה'] !== currentFilters.country) {
      return false;
    }

    // Category filter
    const productCategory = product['קטגוריה אוטומטי'] || product['קטגוריה'];
    if (currentFilters.category && productCategory !== currentFilters.category) {
      return false;
    }

    // Client/Brand filter
    if (currentFilters.brand) {
      // Normalize the client name
      const normalizedClientName = currentFilters.brand.normalize('NFKC');
      
      // Create aliases for common mixed-language client names
      const clientAliases = {
        'AM-PM': ['אלונית (AM-PM)', 'ampm', 'am-pm', 'אמפמ', 'אלונית'],
        'אלונית': ['אלונית (AM-PM)', 'alonit', 'AM-PM', 'ampm'],
        // Add other known aliases as needed
      };
      
      const aliases = clientAliases[normalizedClientName] || [];
      
      // Check for the client name or any of its aliases
      let clientMatch = false;
      
      // First check the exact client name
      if (product[normalizedClientName] && 
          product[normalizedClientName].toString().toUpperCase() === 'TRUE') {
        clientMatch = true;
      } else {
        // Then check all possible aliases
        for (const alias of aliases) {
          if (product[alias] && product[alias].toString().toUpperCase() === 'TRUE') {
            clientMatch = true;
            break;
          }
        }
        
        // If still no match, check for partial matches (for cases like partial client names)
        if (!clientMatch) {
          for (const key of Object.keys(product)) {
            if ((key.includes(normalizedClientName) || normalizedClientName.includes(key)) &&
                product[key].toString().toUpperCase() === 'TRUE') {
              clientMatch = true;
              break;
            }
          }
        }
      }
      
      if (!clientMatch) return false;
    }
    
    // Brand Group filter - applies differently per product type
    if (currentFilters.brandGroup) {
      let productType = '';
      if (whiskeyProducts.includes(product)) {
        productType = 'whiskey';
      } else if (wineProducts.includes(product)) {
        productType = 'wine';
      } else if (beerProducts.includes(product)) {
        productType = 'beer';
      } else if (foodProducts.includes(product)) {
        productType = 'food';
      } else if (alcoholProducts.includes(product)) {
        productType = 'alcohol';
      }
      
      let productBrandGroup = '';
      
      // Get brand/group value based on product type
      if (productType === 'wine') {
        productBrandGroup = product['קבוצה / מותג'] || '';
      } else if (productType === 'whiskey') {
        productBrandGroup = product['מותג'] || '';
      } else {
        // For alcohol, beer, food, and all others
        productBrandGroup = product['קבוצה / מותג אוטומטי'] || '';
      }
      
      if (productBrandGroup !== currentFilters.brandGroup) {
        return false;
      }
    }
    
    // Wine brand filter has been removed and replaced with the global brandGroup filter
    
    // Kosher filter (skip for whiskey products)
    if (currentFilters.kosher && currentFilters.tab !== 'whiskey') {
      if (!product['כשרות']) {
        return false;
      }
      
      const kosherValue = product['כשרות'].toString().toLowerCase();
      
      if (currentFilters.kosher === 'true') {
        // Filter for kosher products
        if (kosherValue !== 'true' && kosherValue !== 'כן' && kosherValue !== 'כשר') {
          return false;
        }
      } else if (currentFilters.kosher === 'false') {
        // Filter for non-kosher products
        if (kosherValue !== 'false' && kosherValue !== 'לא' && kosherValue !== 'לא כשר') {
          return false;
        }
      }
    }

    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const nameMatch = product['שם פריט אוטומטי'] && product['שם פריט אוטומטי'].toLowerCase().includes(searchLower);
      const descMatch = product['תאור'] && product['תאור'].toLowerCase().includes(searchLower);
      const companyMatch = (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג']) &&
          (product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג']).toLowerCase().includes(searchLower);
      const barcodeMatch = product['ברקוד'] && product['ברקוד'].toLowerCase().includes(searchLower);

      if (!(nameMatch || descMatch || companyMatch || barcodeMatch)) {
        return false;
      }
    }
    
    // Filter by "IsNew" for new products page
    if (currentFilters.isNew) {
      // Check for "IsNew" field - could be in different formats
      const isNewValue = product['IsNew'] || product['חדש'] || product['מוצר חדש'];
      if (!isNewValue || isNewValue.toString().toUpperCase() !== 'TRUE') {
        return false;
      }
    }

    return true;
  });
}

// Display products based on current filters
function displayProducts() {
  const filteredProducts = getFilteredProducts();
  
  // Further filter to remove products with insufficient data
  const validProducts = filteredProducts.filter(product => {
    // Skip products without essential data
    if (!product) return false;
    
    // Determine which tab/category this product is from
    const tabCategory = getCurrentProductCategory(product);
    
    // Get product name from appropriate field based on product type
    let productName = '';
    if (tabCategory === 'whiskey') {
      productName = product['תיאור פריט'] || product['שם פריט אוטומטי'] || '';
    } else {
      productName = product['שם פריט אוטומטי'] || product['תיאור פריט'] || '';
    }
    
    // Product must have a name/title to be valid
    return productName && productName.trim() !== '';
  });

  // Clear container
  productsContainer.innerHTML = '';

  if (validProducts.length === 0) {
    productsContainer.innerHTML = '<p style="text-align: center;">לא נמצאו מוצרים התואמים את החיפוש שלך.</p>';
    return;
  }

  // Display all valid products without grouping
  validProducts.forEach(product => {
    const card = createProductCard(product);
    productsContainer.appendChild(card);
  });
}

// Get product group key
function getProductGroupKey(product) {
  // Get product name based on available fields
  const productName = product['שם פריט אוטומטי'] || product['תיאור פריט'] || '';
  
  if (!productName) return null;

  const company = product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג'] || '';

  return company
      ? `${productName.trim().toLowerCase()}_${company.trim().toLowerCase()}`
      : productName.trim().toLowerCase();
}

// Determine which product category/tab a product belongs to
function getCurrentProductCategory(product) {
  // Check if it's in the specific product arrays
  if (alcoholProducts.includes(product)) {
    return 'alcohol';
  } else if (whiskeyProducts.includes(product)) {
    return 'whiskey';
  } else if (wineProducts.includes(product)) {
    return 'wine';
  } else if (beerProducts.includes(product)) {
    return 'beer';
  } else if (foodProducts.includes(product)) {
    return 'food';
  }
  
  // If not found in arrays (unlikely), check by product properties
  if (product['קטגוריה אוטומטי'] === 'קוניאק' || 
      product['קטגוריה אוטומטי'] === 'וודקה' || 
      product['קטגוריה אוטומטי'] === 'ג\'ין') {
    return 'alcohol';
  } else if (product['קטגוריה אוטומטי'] === 'וויסקי') {
    return 'whiskey';
  } else if (product['קטגוריה אוטומטי'] === 'יין') {
    return 'wine';
  } else if (product['קטגוריה אוטומטי'] === 'בירה') {
    return 'beer';
  }
  
  // Default to the current tab
  return currentFilters.tab === 'all' ? 'alcohol' : currentFilters.tab;
}

// Create product card element
function createProductCard(product) {
  // Validate the product has essential data
  if (!product) {
    console.warn('Attempted to create a card with a null or undefined product');
    return document.createElement('div'); // Return empty div if product is invalid
  }

  // Determine which tab/category this product is from
  const tabCategory = getCurrentProductCategory(product);
  
  // Get product name from appropriate field based on product type
  let productName = '';
  if (tabCategory === 'whiskey') {
    productName = product['תיאור פריט'] || product['שם פריט אוטומטי'] || '';
  } else {
    productName = product['שם פריט אוטומטי'] || product['תיאור פריט'] || '';
  }
  
  // If the product doesn't have a name, it's not valid - return empty div
  if (!productName || productName.trim() === '') {
    console.warn('Attempted to create a card with a product missing a name');
    return document.createElement('div');
  }

  const card = document.createElement('div');
  card.className = 'product-card';

  // Get image URL based on barcode
  const barcode = product['ברקוד'];
  const imageUrl = barcode ? `tl/${barcode}.jpg` : 'placeholder.jpg';

  // Get company/brand name from appropriate field
  const company = product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג'] || '';

  // Kosher status display
  let kosherHtml = '';
  let passoverHtml = '';
  
  // Regular kosher status
  if (product['כשרות']) {
    const kosherValue = product['כשרות'].toString().trim().toLowerCase();
    if (kosherValue === 'true' || kosherValue === 'כן' || kosherValue === 'כשר') {
      kosherHtml = '<div class="kosher-status kosher-yes">כשר</div>';
    } else if (kosherValue === 'false' || kosherValue === 'לא' || kosherValue === 'לא כשר') {
      kosherHtml = '<div class="kosher-status kosher-no">לא כשר</div>';
    }
  }
  
  // Kosher for Passover status - check multiple possible column names
  // Find passover field - might be named in different ways
  let passoverField = null;
  const possiblePassoverFields = ['כשר לפסח', 'כשרות לפסח', 'פסח'];
  
  for (const field of possiblePassoverFields) {
    if (product[field] !== undefined) {
      passoverField = field;
      console.log('Found passover field:', field, 'with value:', product[field], 'for product:', product['שם פריט אוטומטי'] || product['תיאור פריט']);
      break;
    }
  }
  
  // Debugging one product to see its fields
  if (product['שם פריט אוטומטי'] === 'גוולאנזוניה בראדי' || product['תיאור פריט'] === 'גוולאנזוניה בראדי') {
    console.log('Example product fields:', Object.keys(product).join(', '));
  }
  
  if (passoverField && product[passoverField]) {
    const passoverValue = product[passoverField].toString().trim().toLowerCase();
    if (passoverValue === 'true' || 
        passoverValue === 'כן' || 
        passoverValue === 'כשר' ||
        passoverValue === 'כשר לפסח' ||
        (passoverValue.includes('כשר') && passoverValue.includes('פסח'))) {
      passoverHtml = '<div class="kosher-status kosher-passover">כשר לפסח</div>';
    }
  }
  
  // Get category-specific fields for wine
  let wineFieldsHtml = '';
  if (tabCategory === 'wine') {
    const grapeType = product['זן ענב'] ? `<div class="product-spec"><strong>זן ענב</strong>: ${product['זן ענב']}</div>` : '';
    const sweetness = product['רמת מתיקות'] ? `<div class="product-spec"><strong>רמת מתיקות</strong>: ${product['רמת מתיקות']}</div>` : '';
    const vintage = product['בציר'] ? `<div class="product-spec"><strong>בציר</strong>: ${product['בציר']}</div>` : '';
    const region = product['אזור'] ? `<div class="product-spec"><strong>אזור</strong>: ${product['אזור']}</div>` : '';
    wineFieldsHtml = grapeType + sweetness + vintage + region;
  }
  
  // Get category-specific fields for whiskey
  let whiskeyFieldsHtml = '';
  if (tabCategory === 'whiskey') {
    const barrelType = product['סוג חבית/סיום'] ? `<div class="product-spec"><strong>סוג חבית/סיום</strong>: ${product['סוג חבית/סיום']}</div>` : '';
    const whiskyType = product['סוג'] ? `<div class="product-spec"><strong>סוג</strong>: ${product['סוג']}</div>` : '';
    const age = product['גיל'] ? `<div class="product-spec"><strong>גיל</strong>: ${product['גיל']}</div>` : '';
    const abv = product['אחוז אלכוהול'] ? `<div class="product-spec"><strong>אחוז אלכוהול</strong>: ${product['אחוז אלכוהול']}</div>` : '';
    whiskeyFieldsHtml = barrelType + whiskyType + age + abv;
  }
  
  // Get category-specific fields for beer
  let beerFieldsHtml = '';
  if (tabCategory === 'beer') {
    const beerType = product['סוג בירה'] ? `<div class="product-spec"><strong>סוג בירה</strong>: ${product['סוג בירה']}</div>` : '';
    const abv = product['אחוז אלכוהול'] ? `<div class="product-spec"><strong>אחוז אלכוהול</strong>: ${product['אחוז אלכוהול']}</div>` : '';
    const ibu = product['IBU'] ? `<div class="product-spec"><strong>IBU</strong>: ${product['IBU']}</div>` : '';
    beerFieldsHtml = beerType + abv + ibu;
  }
  
  // Get category-specific fields for food
  let foodFieldsHtml = '';
  if (tabCategory === 'food') {
    const ingredients = product['מרכיבים'] ? `<div class="product-spec"><strong>מרכיבים</strong>: ${product['מרכיבים']}</div>` : '';
    const nutritionalInfo = product['ערכים תזונתיים'] ? `<div class="product-spec"><strong>ערכים תזונתיים</strong>: ${product['ערכים תזונתיים']}</div>` : '';
    const shelfLife = product['חיי מדף'] ? `<div class="product-spec"><strong>חיי מדף</strong>: ${product['חיי מדף']}</div>` : '';
    foodFieldsHtml = ingredients + nutritionalInfo + shelfLife;
  }
  
  // Get category-specific fields for alcohol
  let alcoholFieldsHtml = '';
  if (tabCategory === 'alcohol') {
    const alcoholType = product['סוג אלכוהול'] ? `<div class="product-spec"><strong>סוג אלכוהול</strong>: ${product['סוג אלכוהול']}</div>` : '';
    const abv = product['אחוז אלכוהול'] ? `<div class="product-spec"><strong>אחוז אלכוהול</strong>: ${product['אחוז אלכוהול']}</div>` : '';
    const flavor = product['טעם'] ? `<div class="product-spec"><strong>טעם</strong>: ${product['טעם']}</div>` : '';
    alcoholFieldsHtml = alcoholType + abv + flavor;
  }

  // Get volume for beverages
  let volumeHtml = '';
  if (product['נפח'] || product['נפח (ליטר)']) {
    const volume = product['נפח'] || product['נפח (ליטר)'] || '';
    volumeHtml = `<div class="product-volume"><strong>נפח</strong>: ${volume}</div>`;
  }
  
  // Get weight for food or volume for juice/syrup
  let weightHtml = '';
  if (tabCategory === 'food' && product['משקל']) {
    const autoCategory = product['קטגוריה אוטומטי'] ? product['קטגוריה אוטומטי'].toLowerCase() : '';
    // Check if it's juice or syrup, display in liters
    if (autoCategory === 'מיץ' || autoCategory === 'סירופ') {
      weightHtml = `<div class="product-weight"><strong>נפח</strong>: ${product['משקל']} ל'</div>`;
    } else {
      weightHtml = `<div class="product-weight"><strong>משקל</strong>: ${product['משקל']} גרם</div>`;
    }
  }
  
  // Get description
  let descriptionHtml = '';
  if (product['תאור'] || product['תיאור פריט']) {
    const description = product['תאור'] || product['תיאור פריט'] || '';
    descriptionHtml = `<div class="product-description">${description}</div>`;
  }

  // Get country code for flag
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
  
  // Get price if available - prioritize מחירון field if available
  let priceHtml = '';
  if (product['מחירון']) {
    // Use the מחירון field which already includes the ₪ symbol
    priceHtml = `<span class="price pricelist">${product['מחירון']}</span>`;
  } else if (product['מחירון']) {
    // Fallback to the existing מחירון field
    priceHtml = `<span class="price">${product['מחירון']} ₪</span>`;
  } else if (currentFilters.brand && product[currentFilters.brand] === 'TRUE') {
    // If a brand is selected and this product is TRUE for that brand, we could show specific pricing
    // This is a placeholder for future pricing logic
    // This is a placeholder for future pricing logic
    priceHtml = `<span class="price available">זמין</span>`;
  }

  // Only show client-specific buttons for client users
  const showClientButtons = window.userRole === USER_ROLES.CLIENT;
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${productName}" onerror="if(this.src.includes('tl/')){ this.src='media/${barcode || ''}.jpg'; } else if(this.src.includes('media/')){ this.src='images/logo.png'; this.nextElementSibling.style.display='block'; }">
      <div class="image-not-found">image not found</div>
      ${product['IsNew'] && product['IsNew'].toLowerCase() === 'true' ? '<span class="new-notification-badge">חדש!</span>' : ''}
      ${showClientButtons ? 
        `<div class="product-buttons">
          <button class="heart-button" data-barcode="${barcode || ''}"><i class="heart-icon">♡</i></button>
          <button class="cart-button" data-barcode="${barcode || ''}" data-product-name="${productName.replace(/"/g, '&quot;')}" data-price="${product['מחיר'] || '0'}" data-pricelist="${product['מחירון'] || ''}"><i class="cart-icon">🛒</i></button>
        </div>` 
        : ''}
    </div>
    <div class="product-info">
      <h3>${productName}</h3>
      ${company ? `<div class="product-company">${company}</div>` : ''}
      ${product['מדינה'] ? `<div class="product-country">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה']}</span>
      </div>` : ''}
      <div class="kosher-tags">
        ${kosherHtml}
        ${passoverHtml}
      </div>
      ${wineFieldsHtml}
      ${whiskeyFieldsHtml}
      ${beerFieldsHtml}
      ${foodFieldsHtml}
      ${alcoholFieldsHtml}
      ${volumeHtml}
      ${descriptionHtml}
      ${weightHtml}
      <div class="product-details">
        ${barcode ? `<span class="barcode">${barcode}</span>` : ''}
        ${priceHtml}
      </div>
    </div>
  `;

  // Add click event to open modal with improved mobile support
  const handleCardClick = (e) => {
    // Don't open modal if heart button or cart button was clicked
    if (
      e.target.closest('.heart-button') ||
      e.target.classList.contains('heart-icon') ||
      e.target.closest('.cart-button') ||
      e.target.classList.contains('cart-icon')
    ) {
      e.stopPropagation();
      return;
    }

    // Log for debugging
    console.log('Opening product modal for:', product['שם פריט אוטומטי'] || product['תיאור פריט']);

    try {
      openProductModal(product);
    } catch (error) {
      console.error('Error opening product modal:', error);
      alert('שגיאה בפתיחת מידע על המוצר. אנא נסה שוב מאוחר יותר.');
    }
  };

  // Use only click event for desktop
  card.addEventListener('click', handleCardClick);

  // Add touch variables to track touch on mobile
  let touchStartY = 0;
  let touchEndY = 0;
  const minSwipeDistance = 10; // Minimum distance to consider a swipe vs a tap

  // Track touch start position
  card.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  // Only open modal on touchend if it's a tap (not a scroll)
  card.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].clientY;
    const touchDistance = Math.abs(touchEndY - touchStartY);

    // Only count as a click if the user didn't scroll much
    if (touchDistance < minSwipeDistance) {
      handleCardClick(e);
    }
  }, { passive: true });

  // Add heart button click event - only for client users
  const heartButton = card.querySelector('.heart-button');
  if (heartButton && showClientButtons) {
    heartButton.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent modal from opening
      
      // Check if user is logged in
      if (!auth.currentUser) {
        alert('עליך להתחבר כדי לסמן מוצרים כמועדפים');
        window.location.href = 'login.html';
        return;
      }
      
      const heartIcon = heartButton.querySelector('.heart-icon');
      const barcode = heartButton.dataset.barcode;
      
      if (!barcode) {
        console.error('No barcode found for product');
        return;
      }
      
      try {
        // Toggle like in Firebase
        const isLiked = await toggleProductLike(barcode);
        
        // Update UI
        if (isLiked) {
          heartButton.classList.add('liked');
          heartIcon.textContent = '♥'; // Filled heart
          
          // Add to local likes array
          if (!window.userLikes) window.userLikes = [];
          if (!window.userLikes.includes(barcode)) {
            window.userLikes.push(barcode);
          }
        } else {
          heartButton.classList.remove('liked');
          heartIcon.textContent = '♡'; // Empty heart
          
          // Remove from local likes array
          if (window.userLikes) {
            window.userLikes = window.userLikes.filter(b => b !== barcode);
          }
        }
        
        // Update modal heart button if open
        const modalHeartButton = document.querySelector('.modal-heart-button');
        if (modalHeartButton && modalHeartButton.dataset.barcode === barcode) {
          if (isLiked) {
            modalHeartButton.classList.add('liked');
            const heartIcon = modalHeartButton.querySelector('.heart-icon');
            if (heartIcon) heartIcon.textContent = '♥';
          } else {
            modalHeartButton.classList.remove('liked');
            const heartIcon = modalHeartButton.querySelector('.heart-icon');
            if (heartIcon) heartIcon.textContent = '♡';
          }
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        alert('שגיאה בסימון המוצר כמועדף. אנא נסה שוב מאוחר יותר.');
      }
    });
  }
  
  // Add cart button click event - only for client users
  const cartButton = card.querySelector('.cart-button');
  if (cartButton && showClientButtons) {
    cartButton.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent modal from opening
      
      // Check if user is logged in
      if (!auth.currentUser) {
        alert('עליך להתחבר כדי להוסיף מוצרים לעגלה');
        window.location.href = 'login.html';
        return;
      }
      
      const barcode = cartButton.dataset.barcode;
      const productName = cartButton.dataset.productName;
      let price = cartButton.dataset.price;
      
      if (!barcode) {
        console.error('No barcode found for product');
        return;
      }
      
      // Get the מחירון value from data attribute
      const pricelist = cartButton.dataset.pricelist || null;
      
      // Show quantity prompt modal
      const quantity = await showQuantityPrompt(productName);
      
      // If quantity is undefined or null, it means the user cancelled
      if (quantity === undefined || quantity === null) {
        return;
      }
      
      try {
        // Add to cart in Firebase with selected quantity
        const success = await addToCart({
          barcode: barcode,
          name: productName,
          price: parseFloat(price) || 0,
          מחירון: pricelist,
          category: currentFilters.tab
        }, quantity);
        
        if (success) {
          // Show success message
          const toastMessage = document.createElement('div');
          toastMessage.className = 'toast-message';
          toastMessage.textContent = `${quantity} יחידות נוספו לעגלה בהצלחה`;
          document.body.appendChild(toastMessage);
          
          // Update cart count in header if exists
          updateCartCount();
          
          // Animate toast message
          setTimeout(() => {
            toastMessage.classList.add('show');
            
            setTimeout(() => {
              toastMessage.classList.remove('show');
              setTimeout(() => {
                document.body.removeChild(toastMessage);
              }, 300);
            }, 2000);
          }, 100);
        } else {
          console.error('Failed to add product to cart');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('שגיאה בהוספת המוצר לעגלה. אנא נסה שוב מאוחר יותר.');
      }
    });
  }

  return card;
}

// Open product modal
function openProductModal(product) {
  // Safety check for modal and other DOM elements
  if (!modal || !modalTitle || !modalCompany || !modalDescription) {
    console.error('Modal DOM elements not found', {
      modal: !!modal,
      modalTitle: !!modalTitle,
      modalCompany: !!modalCompany,
      modalDescription: !!modalDescription
    });
    return;
  }
  
  console.log('Opening modal for product:', product);
  
  const groupKey = getProductGroupKey(product);
  const group = groupKey ? groupedProducts[groupKey] : null;

  // Get company/brand name
  const company = product.company || product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג'] || '';

  // Set modal content based on product type
  const productType = getCurrentProductCategory(product);
  if (productType === 'whiskey') {
    modalTitle.textContent = product['תיאור פריט'] || product['שם פריט אוטומטי'] || 'Unnamed Product';
  } else {
    modalTitle.textContent = product['שם פריט אוטומטי'] || product['תיאור פריט'] || 'Unnamed Product';
  }
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

  // Add kosher status to modal
  if (product['כשרות']) {
    const kosherSpec = document.createElement('div');
    kosherSpec.className = 'spec-item';
    
    let kosherValue;
    const kosherRawValue = product['כשרות'].toString().trim().toLowerCase();
    
    if (kosherRawValue === 'true' || kosherRawValue === 'כן' || kosherRawValue === 'כשר') {
      kosherValue = '<span class="kosher-status kosher-yes">כשר</span>';
    } else if (kosherRawValue === 'false' || kosherRawValue === 'לא' || kosherRawValue === 'לא כשר') {
      kosherValue = '<span class="kosher-status kosher-no">לא כשר</span>';
    } else {
      // Don't display raw values like TRUE/FALSE, just show a neutral value
      if (kosherRawValue === 'true' || kosherRawValue === 'false') {
        kosherValue = '';
      } else {
        kosherValue = product['כשרות'];
      }
    }
    
    // Add Passover status if available - check multiple possible column names
    let passoverField = null;
    const possiblePassoverFields = ['כשר לפסח', 'כשרות לפסח', 'פסח'];
    
    for (const field of possiblePassoverFields) {
      if (product[field] !== undefined) {
        passoverField = field;
        break;
      }
    }
    
    if (passoverField && product[passoverField]) {
      const passoverValue = product[passoverField].toString().trim().toLowerCase();
      if (passoverValue === 'true' || 
          passoverValue === 'כן' || 
          passoverValue === 'כשר' || 
          passoverValue === 'כשר לפסח' ||
          (passoverValue.includes('כשר') && passoverValue.includes('פסח'))) {
        kosherValue += ' <span class="kosher-status kosher-passover">כשר לפסח</span>';
      }
    }
    
    kosherSpec.innerHTML = `
      <div class="spec-label"><strong>כשרות</strong>:</div>
      <div class="spec-value">${kosherValue}</div>
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
      <div class="spec-label"><strong>מדינת ייצור</strong>:</div>
      <div class="spec-value">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה']}</span>
      </div>
    `;
    modalSpecs.appendChild(countrySpec);
  }

  // Just collect the brand information but don't display it on the product card
  const productBrands = [];
  for (const brand of brands) {
    if (product[brand] && product[brand].toLowerCase() === 'true') {
      productBrands.push(brand);
    }
  }
  
  // Removed the brand display section entirely

  // Add price information as top spec if available
  if (product['מחירון']) {
    const priceSpec = document.createElement('div');
    priceSpec.className = 'spec-item price-spec';
    priceSpec.innerHTML = `
      <div class="spec-label"><strong>מחירון</strong>:</div>
      <div class="spec-value price-value">${product['מחירון']}</div>
    `;
    modalSpecs.appendChild(priceSpec);
  } else if (product['מחירון']) {
    const priceSpec = document.createElement('div');
    priceSpec.className = 'spec-item price-spec';
    priceSpec.innerHTML = `
      <div class="spec-label"><strong>מחיר</strong>:</div>
      <div class="spec-value price-value">${product['מחירון']} ₪</div>
    `;
    modalSpecs.appendChild(priceSpec);
  }

  // Add product specs
  for (const [key, value] of Object.entries(product)) {
    // Skip empty values, brands, and fields displayed elsewhere
    if (!value || 
        key === 'שם פריט אוטומטי' || 
        key === 'תאור' || 
        key === 'מחירון' || // Already displayed in special section
        key === 'מחיר' || // Already displayed in special section
        key === 'כשרות' || // Already displayed in special section
        key === 'כשר לפסח' || // Already included with kosher status
        key === 'כשרות לפסח' || // Alternate passover field name
        key === 'פסח' || // Another possible passover field name
        key === 'מדינה' ||
        key === 'company' || 
        key === 'קבוצה / מותג' || 
        key === 'קבוצה / מותג אוטומטי' ||
        brands.includes(key) ||
        // Skip values that are just TRUE/FALSE strings
        (typeof value === 'string' && 
         (value.trim().toUpperCase() === 'TRUE' || 
          value.trim().toUpperCase() === 'FALSE'))) continue;

    const specItem = document.createElement('div');
    specItem.className = 'spec-item';

    specItem.innerHTML = `
      <div class="spec-label"><strong>${key}</strong>:</div>
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

  // Check if product is liked by current user
  const isLiked = window.userLikes && window.userLikes.includes(barcode);
  
  // Only add heart button for client users
  const showHeartButton = window.userRole === USER_ROLES.CLIENT;
  
  // Manage modal heart button
  let modalHeartButton = document.querySelector('.modal-heart-button');
  
  // Remove heart button if exists but user is not a client
  if (modalHeartButton && !showHeartButton) {
    modalHeartButton.remove();
    modalHeartButton = null;
  }
  
  // Add heart button if user is a client and heart button doesn't exist yet
  if (showHeartButton && !modalHeartButton) {
    modalHeartButton = document.createElement('button');
    modalHeartButton.className = 'modal-heart-button';
    modalHeartButton.innerHTML = `<i class="heart-icon">${isLiked ? '♥' : '♡'}</i>`;
    modalHeartButton.dataset.barcode = barcode || '';
    if (isLiked) modalHeartButton.classList.add('liked');
    
    document.querySelector('.modal-header').appendChild(modalHeartButton);
    
    // Add event listener to heart button
    modalHeartButton.addEventListener('click', async function() {
      // Check if user is logged in
      if (!auth.currentUser) {
        alert('עליך להתחבר כדי לסמן מוצרים כמועדפים');
        window.location.href = 'login.html';
        return;
      }
      
      const barcode = this.dataset.barcode;
      
      if (!barcode) {
        console.error('No barcode found for product');
        return;
      }
      
      try {
        // Toggle like in Firebase
        const isLiked = await toggleProductLike(barcode);
        
        const heartIcon = this.querySelector('.heart-icon');
        
        // Update UI
        if (isLiked) {
          this.classList.add('liked');
          heartIcon.textContent = '♥'; // Filled heart
          
          // Add to local likes array
          if (!window.userLikes) window.userLikes = [];
          if (!window.userLikes.includes(barcode)) {
            window.userLikes.push(barcode);
          }
          
          // Update grid view heart too
          const gridHeartButton = document.querySelector(`.heart-button[data-barcode="${barcode}"]`);
          if (gridHeartButton) {
            gridHeartButton.classList.add('liked');
            const heartIcon = gridHeartButton.querySelector('.heart-icon');
            if (heartIcon) heartIcon.textContent = '♥';
          }
        } else {
          this.classList.remove('liked');
          heartIcon.textContent = '♡'; // Empty heart
          
          // Remove from local likes array
          if (window.userLikes) {
            window.userLikes = window.userLikes.filter(b => b !== barcode);
          }
          
          // Update grid view heart too
          const gridHeartButton = document.querySelector(`.heart-button[data-barcode="${barcode}"]`);
          if (gridHeartButton) {
            gridHeartButton.classList.remove('liked');
            const heartIcon = gridHeartButton.querySelector('.heart-icon');
            if (heartIcon) heartIcon.textContent = '♡';
          }
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        alert('שגיאה בסימון המוצר כמועדף. אנא נסה שוב מאוחר יותר.');
      }
    });
  } else if (modalHeartButton) {
    // Update existing heart button if it exists
    modalHeartButton.dataset.barcode = barcode || '';
    const heartIcon = modalHeartButton.querySelector('.heart-icon');
    if (heartIcon) {
      if (isLiked) {
        modalHeartButton.classList.add('liked');
        heartIcon.textContent = '♥';
      } else {
        modalHeartButton.classList.remove('liked');
        heartIcon.textContent = '♡';
      }
    }
  }
  
  // Add cart button to modal if user is client
  if (showHeartButton) {
    let modalCartButton = document.querySelector('.modal-cart-button');
    if (!modalCartButton) {
      modalCartButton = document.createElement('button');
      modalCartButton.className = 'modal-cart-button';
      modalCartButton.innerHTML = `<i class="cart-icon">🛒</i>`;
      modalCartButton.dataset.barcode = barcode || '';
      modalCartButton.dataset.productName = modalTitle.textContent;
      modalCartButton.dataset.price = product['מחירון'] || '0';
      modalCartButton.style.position = 'absolute';
      modalCartButton.style.right = '40px';
      modalCartButton.style.top = '10px';
      modalCartButton.style.background = 'white';
      modalCartButton.style.border = 'none';
      modalCartButton.style.borderRadius = '50%';
      modalCartButton.style.width = '36px';
      modalCartButton.style.height = '36px';
      modalCartButton.style.display = 'flex';
      modalCartButton.style.alignItems = 'center';
      modalCartButton.style.justifyContent = 'center';
      modalCartButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      modalCartButton.style.cursor = 'pointer';
      modalCartButton.style.zIndex = '10';
      
      document.querySelector('.modal-header').appendChild(modalCartButton);
      
      // Add event listener to cart button
      modalCartButton.addEventListener('click', async function() {
        // Check if user is logged in
        if (!auth.currentUser) {
          alert('עליך להתחבר כדי להוסיף מוצרים לעגלה');
          window.location.href = 'login.html';
          return;
        }
        
        const barcode = this.dataset.barcode;
        const productName = this.dataset.productName;
        const price = this.dataset.price;
        
        if (!barcode) {
          console.error('No barcode found for product');
          return;
        }
        
        // Get the מחירון value from data attribute
        const pricelist = this.dataset.pricelist || null;
        
        // Show quantity prompt modal
        const quantity = await showQuantityPrompt(productName);
        
        // If quantity is undefined or null, it means the user cancelled
        if (quantity === undefined || quantity === null) {
          return;
        }
        
        try {
          // Add to cart in Firebase with selected quantity
          const success = await addToCart({
            barcode: barcode,
            name: productName,
            price: parseFloat(price) || 0,
            מחירון: pricelist,
            category: currentFilters.tab
          }, quantity);
          
          if (success) {
            // Close modal
            closeProductModal();
            
            // Show success message
            const toastMessage = document.createElement('div');
            toastMessage.className = 'toast-message';
            toastMessage.textContent = `${quantity} יחידות נוספו לעגלה בהצלחה`;
            document.body.appendChild(toastMessage);
            
            // Update cart count in header if exists
            updateCartCount();
            
            // Animate toast message
            setTimeout(() => {
              toastMessage.classList.add('show');
              
              setTimeout(() => {
                toastMessage.classList.remove('show');
                setTimeout(() => {
                  document.body.removeChild(toastMessage);
                }, 300);
              }, 2000);
            }, 100);
          } else {
            console.error('Failed to add product to cart');
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
          alert('שגיאה בהוספת המוצר לעגלה. אנא נסה שוב מאוחר יותר.');
        }
      });
    } else if (modalCartButton) {
      // Update existing cart button if it exists
      modalCartButton.dataset.barcode = barcode || '';
      modalCartButton.dataset.productName = modalTitle.textContent;
      modalCartButton.dataset.price = product['מחירון'] || '0';
      modalCartButton.dataset.pricelist = product['מחירון'] || '';
    }
  } else {
    // Remove cart button if exists and user is not a client
    const modalCartButton = document.querySelector('.modal-cart-button');
    if (modalCartButton) {
      modalCartButton.remove();
    }
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
  currentFilters.brandGroup = '';
  currentFilters.kosher = '';
  countryFilter.value = '';
  categoryFilter.value = '';
  brandFilter.value = '';
  brandGroupFilter.value = '';
  kosherFilter.value = '';
  
  // Reset styling
  updateSelectStyling(countryFilter);
  updateSelectStyling(categoryFilter);
  updateSelectStyling(brandFilter);
  updateSelectStyling(brandGroupFilter);
  updateSelectStyling(kosherFilter);

  // Only show brand filter for admin and agent roles
  const brandFilterContainer = brandFilter.closest('.filter-group');
  if (brandFilterContainer) {
    if (window.userRole === USER_ROLES.ADMIN || window.userRole === USER_ROLES.AGENT) {
      brandFilterContainer.style.display = '';
    } else {
      brandFilterContainer.style.display = 'none';
    }
  }

  // Update filter options based on the new tab
  populateFilters();

  // Display filtered products
  displayProducts();
}

// Perform search (triggered by button click)
function performSearch() {
  currentFilters.search = searchInput.value;
  // Update filters based on search results
  populateFilters('search-input');
  displayProducts();
}

// Show quantity prompt modal for adding product to cart
async function showQuantityPrompt(productName) {
  return new Promise((resolve) => {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'quantity-modal';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'quantity-modal-content';
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    modalContent.style.maxWidth = '90%';
    modalContent.style.width = '400px';
    modalContent.style.textAlign = 'center';
    
    // Product name header
    const header = document.createElement('h3');
    header.textContent = productName;
    header.style.margin = '0 0 15px 0';
    
    // Title
    const title = document.createElement('p');
    title.textContent = 'בחר כמות להוספה לעגלה:';
    title.style.marginBottom = '15px';
    
    // Quantity control
    const quantityControl = document.createElement('div');
    quantityControl.style.display = 'flex';
    quantityControl.style.justifyContent = 'center';
    quantityControl.style.alignItems = 'center';
    quantityControl.style.marginBottom = '20px';
    
    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-';
    decreaseBtn.style.width = '40px';
    decreaseBtn.style.height = '40px';
    decreaseBtn.style.fontSize = '20px';
    decreaseBtn.style.backgroundColor = '#f1f1f1';
    decreaseBtn.style.border = 'none';
    decreaseBtn.style.borderRadius = '50%';
    decreaseBtn.style.cursor = 'pointer';
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.value = '1';
    quantityInput.style.width = '60px';
    quantityInput.style.height = '40px';
    quantityInput.style.margin = '0 10px';
    quantityInput.style.textAlign = 'center';
    quantityInput.style.fontSize = '18px';
    quantityInput.style.border = '1px solid #ddd';
    quantityInput.style.borderRadius = '4px';
    
    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+';
    increaseBtn.style.width = '40px';
    increaseBtn.style.height = '40px';
    increaseBtn.style.fontSize = '20px';
    increaseBtn.style.backgroundColor = '#f1f1f1';
    increaseBtn.style.border = 'none';
    increaseBtn.style.borderRadius = '50%';
    increaseBtn.style.cursor = 'pointer';
    
    // Buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'ביטול';
    cancelBtn.style.padding = '10px 20px';
    cancelBtn.style.backgroundColor = '#95a5a6';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontSize = '16px';
    
    const addBtn = document.createElement('button');
    addBtn.textContent = 'הוסף לעגלה';
    addBtn.style.padding = '10px 20px';
    addBtn.style.backgroundColor = '#27ae60';
    addBtn.style.color = 'white';
    addBtn.style.border = 'none';
    addBtn.style.borderRadius = '4px';
    addBtn.style.cursor = 'pointer';
    addBtn.style.fontSize = '16px';
    
    // Assemble modal
    quantityControl.appendChild(decreaseBtn);
    quantityControl.appendChild(quantityInput);
    quantityControl.appendChild(increaseBtn);
    
    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(addBtn);
    
    modalContent.appendChild(header);
    modalContent.appendChild(title);
    modalContent.appendChild(quantityControl);
    modalContent.appendChild(buttonsContainer);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = (currentValue - 1).toString();
      }
    });
    
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      quantityInput.value = (currentValue + 1).toString();
    });
    
    quantityInput.addEventListener('input', () => {
      const value = parseInt(quantityInput.value);
      if (isNaN(value) || value < 1) {
        quantityInput.value = '1';
      }
    });
    
    // Handle input focus for mobile keyboards
    quantityInput.addEventListener('focus', function() {
      this.select();
    });
    
    quantityInput.addEventListener('blur', function() {
      const value = parseInt(this.value);
      if (isNaN(value) || value < 1) {
        this.value = '1';
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null); // Cancel
    });
    
    addBtn.addEventListener('click', () => {
      const quantity = parseInt(quantityInput.value);
      document.body.removeChild(modal);
      resolve(quantity);
    });
    
    // Close modal by clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null); // Cancel
      }
    });
  });
}

// Update cart count in header
async function updateCartCount() {
  // Check if the cart count badge exists
  let cartCountBadge = document.getElementById('cart-count-badge');
  
  // If there's no badge yet, create one
  if (!cartCountBadge) {
    // Find the header element
    const header = document.querySelector('header');
    if (!header) return;
    
    // Check if auth container exists
    const authContainer = header.querySelector('.auth-container');
    if (!authContainer) return;
    
    // Create cart button if it doesn't exist
    let cartButton = document.getElementById('cart-button-header');
    if (!cartButton) {
      cartButton = document.createElement('button');
      cartButton.id = 'cart-button-header';
      cartButton.className = 'cart-button-header';
      cartButton.innerHTML = '🛒 עגלת קניות';
      cartButton.addEventListener('click', () => {
        window.location.href = 'shopping-cart.html';
      });
      
      // Add cart count badge
      cartCountBadge = document.createElement('span');
      cartCountBadge.id = 'cart-count-badge';
      cartCountBadge.className = 'cart-count-badge';
      cartCountBadge.textContent = '0';
      
      // Insert after favorites button if it exists, otherwise before logout button
      const favoritesButton = authContainer.querySelector('#favorites-button');
      if (favoritesButton) {
        authContainer.insertBefore(cartButton, favoritesButton.nextSibling);
      } else {
        const logoutButton = authContainer.querySelector('#logout-button');
        if (logoutButton) {
          authContainer.insertBefore(cartButton, logoutButton);
        } else {
          authContainer.appendChild(cartButton);
        }
      }
    }
  }
  
  // Get cart count
  if (auth.currentUser) {
    const cart = await getUserCart();
    const count = cart.length;
    
    // Update badge
    if (cartCountBadge) {
      cartCountBadge.textContent = count.toString();
      cartCountBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
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
      
      // Don't clear brand filter for any tab since it's now for clients
      
      switchTab(tabName);
    });
  });

  // Function to update filter options as soon as a dropdown is clicked
  function handleFilterFocus(filterElement, filterName) {
    console.log(`${filterName} filter clicked/focused`);
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the filter that's being focused
    const filteredProducts = getDynamicallyFilteredProducts(products, filterName);
    
    // Update all filter options based on the current state
    updateFilterOptions(filteredProducts);
  }

  // Add mousedown/focus events to trigger dynamic filtering BEFORE selection
  countryFilter.addEventListener('mousedown', function(event) {
    // Only process if this is the initial click to open the dropdown
    if (this.getAttribute('data-open') !== 'true') {
      this.setAttribute('data-open', 'true');
      handleFilterFocus(this, 'country-filter');
    }
  });
  
  categoryFilter.addEventListener('mousedown', function(event) {
    if (this.getAttribute('data-open') !== 'true') {
      this.setAttribute('data-open', 'true');
      handleFilterFocus(this, 'category-filter');
    }
  });
  
  brandFilter.addEventListener('mousedown', function(event) {
    if (this.getAttribute('data-open') !== 'true') {
      this.setAttribute('data-open', 'true');
      handleFilterFocus(this, 'brand-filter');
    }
  });
  
  brandGroupFilter.addEventListener('mousedown', function(event) {
    if (this.getAttribute('data-open') !== 'true') {
      this.setAttribute('data-open', 'true');
      handleFilterFocus(this, 'brand-group-filter');
    }
  });
  
  kosherFilter.addEventListener('mousedown', function(event) {
    if (this.getAttribute('data-open') !== 'true') {
      this.setAttribute('data-open', 'true');
      handleFilterFocus(this, 'kosher-filter');
    }
  });
  
  // Reset the open state when the dropdown closes
  document.addEventListener('click', function(event) {
    const filters = [countryFilter, categoryFilter, brandFilter, brandGroupFilter, kosherFilter];
    filters.forEach(filter => {
      if (!filter.contains(event.target)) {
        filter.setAttribute('data-open', 'false');
      }
    });
  });

  // Filter change events - ensure they're only attached once
  countryFilter.addEventListener('change', function() {
    console.log(`Country filter changed to: ${this.value}`);
    currentFilters.country = this.value;
    updateSelectStyling(this);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the country filter that's being changed
    const filteredProducts = getDynamicallyFilteredProducts(products, 'country-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
    
    // Reset the open state
    this.setAttribute('data-open', 'false');
  });

  categoryFilter.addEventListener('change', function() {
    console.log(`Category filter changed to: ${this.value}`);
    currentFilters.category = this.value;
    updateSelectStyling(this);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the category filter that's being changed
    const filteredProducts = getDynamicallyFilteredProducts(products, 'category-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
    
    // Reset the open state
    this.setAttribute('data-open', 'false');
  });
  
  brandFilter.addEventListener('change', function() {
    console.log(`Brand filter changed to: ${this.value}`);
    currentFilters.brand = this.value;
    updateSelectStyling(this);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the brand filter that's being changed
    const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
    
    // Reset the open state
    this.setAttribute('data-open', 'false');
  });
  
  brandGroupFilter.addEventListener('change', function() {
    console.log(`Brand group filter changed to: ${this.value}`);
    currentFilters.brandGroup = this.value;
    updateSelectStyling(this);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the brand group filter that's being changed
    const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-group-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
    
    // Reset the open state
    this.setAttribute('data-open', 'false');
  });
  
  kosherFilter.addEventListener('change', function() {
    console.log(`Kosher filter changed to: ${this.value}`);
    currentFilters.kosher = this.value;
    updateSelectStyling(this);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products, excluding the kosher filter that's being changed
    const filteredProducts = getDynamicallyFilteredProducts(products, 'kosher-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
    
    // Reset the open state
    this.setAttribute('data-open', 'false');
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
      updateFilterStates();
      // Update filters based on search results
      populateFilters('search-input');
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
  
  // Brand filter modal has been replaced with dropdown

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (modal.style.display === 'block') {
        closeProductModal();
      }
      // Brand filter modal was replaced with dropdown, so we don't need to close it
    }
  });

  // Clear filter buttons
  clearCountryFilterBtn.addEventListener('click', function() {
    console.log('Clearing country filter');
    countryFilter.value = '';
    currentFilters.country = '';
    updateSelectStyling(countryFilter);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products after clearing this filter
    const filteredProducts = getDynamicallyFilteredProducts(products, 'country-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
  });

  clearCategoryFilterBtn.addEventListener('click', function() {
    console.log('Clearing category filter');
    categoryFilter.value = '';
    currentFilters.category = '';
    updateSelectStyling(categoryFilter);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products after clearing this filter
    const filteredProducts = getDynamicallyFilteredProducts(products, 'category-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
  });

  clearBrandFilterBtn.addEventListener('click', function() {
    console.log('Clearing brand filter');
    brandFilter.value = '';
    currentFilters.brand = '';
    updateSelectStyling(brandFilter);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products after clearing this filter
    const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
  });
  
  clearBrandGroupFilterBtn.addEventListener('click', function() {
    console.log('Clearing brand group filter');
    brandGroupFilter.value = '';
    currentFilters.brandGroup = '';
    updateSelectStyling(brandGroupFilter);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products after clearing this filter
    const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-group-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
  });

  clearKosherFilterBtn.addEventListener('click', function() {
    console.log('Clearing kosher filter');
    kosherFilter.value = '';
    currentFilters.kosher = '';
    updateSelectStyling(kosherFilter);
    updateFilterStates();
    
    // Get products based on current tab
    const products = getProductsByTab();
    
    // Get filtered products after clearing this filter
    const filteredProducts = getDynamicallyFilteredProducts(products, 'kosher-filter');
    
    // Update other filters based on this selection
    updateFilterOptions(filteredProducts);
    
    // Display filtered products
    displayProducts();
  });
}

// Update filter styling and active states
function updateFilterStates() {
  const filterGroups = document.querySelectorAll('.filter-group');
  let activeFiltersCount = 0;
  
  filterGroups.forEach(group => {
    const select = group.querySelector('select');
    const input = group.querySelector('input');
    const element = select || input;
    
    if (element && element.value) {
      group.classList.add('active');
      activeFiltersCount++;
    } else {
      group.classList.remove('active');
    }
  });
  
  // Show/hide clear all filters button based on active filters
  const clearAllBtn = document.getElementById('clear-all-filters');
  if (clearAllBtn) {
    if (activeFiltersCount > 0) {
      clearAllBtn.style.display = 'flex';
    } else {
      clearAllBtn.style.display = 'none';
    }
  }
}

// Add a function to handle filter changes with debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create a debounced version of populateFilters
const debouncedPopulateFilters = debounce((excludeFilter) => {
  populateFilters(excludeFilter);
}, 300);

// Filter change events with improved handling
countryFilter.addEventListener('change', function() {
  console.log(`Country filter changed to: ${this.value}`);
  currentFilters.country = this.value;
  updateSelectStyling(this);
  updateFilterStates();
  
  // Immediately update all other filters based on the new selection
  const products = getProductsByTab();
  const filteredProducts = getDynamicallyFilteredProducts(products, 'country-filter');
  updateFilterOptions(filteredProducts);
  displayProducts();
});

categoryFilter.addEventListener('change', function() {
  currentFilters.category = this.value;
  updateSelectStyling(this);
  updateFilterStates();
  
  // Immediately update all other filters based on the new selection
  const products = getProductsByTab();
  const filteredProducts = getDynamicallyFilteredProducts(products, 'category-filter');
  updateFilterOptions(filteredProducts);
  displayProducts();
});

brandFilter.addEventListener('change', function() {
  currentFilters.brand = this.value;
  updateSelectStyling(this);
  updateFilterStates();
  
  // Immediately update all other filters based on the new selection
  const products = getProductsByTab();
  const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-filter');
  updateFilterOptions(filteredProducts);
  displayProducts();
});

brandGroupFilter.addEventListener('change', function() {
  currentFilters.brandGroup = this.value;
  updateSelectStyling(this);
  updateFilterStates();
  
  // Immediately update all other filters based on the new selection
  const products = getProductsByTab();
  const filteredProducts = getDynamicallyFilteredProducts(products, 'brand-group-filter');
  updateFilterOptions(filteredProducts);
  displayProducts();
});

kosherFilter.addEventListener('change', function() {
  currentFilters.kosher = this.value;
  updateSelectStyling(this);
  updateFilterStates();
  
  // Immediately update all other filters based on the new selection
  const products = getProductsByTab();
  const filteredProducts = getDynamicallyFilteredProducts(products, 'kosher-filter');
  updateFilterOptions(filteredProducts);
  displayProducts();
});

// Add a new function to update filter options based on filtered products
function updateFilterOptions(filteredProducts) {
  console.log(`Updating filter options with ${filteredProducts.length} filtered products`);
  
  // Get unique values for each filter from the filtered products
  const countries = [...new Set(filteredProducts.filter(p => p['מדינה']).map(p => p['מדינה']))];
  const categories = [...new Set(filteredProducts.filter(p => p['קטגוריה אוטומטי'] || p['קטגוריה']).map(p => p['קטגוריה אוטומטי'] || p['קטגוריה']))];
  
  // Get brand groups based on product type
  let brandGroups = [];
  if (currentFilters.tab === 'wine') {
    brandGroups = [...new Set(filteredProducts.filter(p => p['קבוצה / מותג']).map(p => p['קבוצה / מותג']))];
  } else if (currentFilters.tab === 'whiskey') {
    brandGroups = [...new Set(filteredProducts.filter(p => p['מותג']).map(p => p['מותג']))];
  } else if (currentFilters.tab === 'all') {
    // For "all" tab, we need to collect brands from all product types
    const wineGroups = [...new Set(filteredProducts.filter(p => wineProducts.includes(p) && p['קבוצה / מותג']).map(p => p['קבוצה / מותג']))];
    const whiskeyGroups = [...new Set(filteredProducts.filter(p => whiskeyProducts.includes(p) && p['מותג']).map(p => p['מותג']))];
    const otherGroups = [...new Set(filteredProducts.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
    
    brandGroups = [...new Set([...wineGroups, ...whiskeyGroups, ...otherGroups])].filter(Boolean);
  } else {
    brandGroups = [...new Set(filteredProducts.filter(p => p['קבוצה / מותג אוטומטי']).map(p => p['קבוצה / מותג אוטומטי']))];
  }

  // Get client names from filtered products
  const availableClients = [];
  filteredProducts.forEach(product => {
    Object.keys(product).forEach(key => {
      if (product[key] && product[key].toString().toUpperCase() === 'TRUE') {
        if (!key.startsWith('מק"ט') && !key.includes('ברקוד') && 
            !key.includes('קטגוריה') && !key.includes('תיאור') && 
            !key.includes('שם פריט') && !key.includes('מחיר') && 
            !key.includes('כשרות')) {
          if (!availableClients.includes(key)) {
            availableClients.push(key);
          }
        }
      }
    });
  });

  // Sort all arrays
  countries.sort();
  categories.sort();
  brandGroups.sort();
  availableClients.sort((a, b) => a.localeCompare(b, 'he'));

  console.log('Updating filters with:');
  console.log('- Countries:', countries.length);
  console.log('- Categories:', categories.length);
  console.log('- Brand Groups:', brandGroups.length);
  console.log('- Clients:', availableClients.length);

  // Rebuild the filter dropdowns completely instead of just hiding options
  
  // Save current selections before rebuilding
  const currentCountry = countryFilter.value;
  const currentCategory = categoryFilter.value;
  const currentBrandGroup = brandGroupFilter.value;
  const currentBrand = brandFilter.value;
  
  // Clear and rebuild country filter
  countryFilter.innerHTML = '<option value="">כל הארצות</option>';
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    if (country === currentCountry) {
      option.selected = true;
    }
    countryFilter.appendChild(option);
  });
  
  // Clear and rebuild category filter
  let categoryPlaceholder = 'כל הקטגוריות';
  if (currentFilters.tab === 'alcohol') {
    categoryPlaceholder = 'כל הסוגים';
  }
  categoryFilter.innerHTML = `<option value="">${categoryPlaceholder}</option>`;
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    if (category === currentCategory) {
      option.selected = true;
    }
    categoryFilter.appendChild(option);
  });
  
  // Clear and rebuild brand group filter
  brandGroupFilter.innerHTML = '<option value="">קבוצה/מותג</option>';
  brandGroups.forEach(group => {
    if (group && group.trim() !== '') {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group;
      if (group === currentBrandGroup) {
        option.selected = true;
      }
      brandGroupFilter.appendChild(option);
    }
  });
  
  // Clear and rebuild client/brand filter (only if user is admin or agent)
  if (window.userRole === USER_ROLES.ADMIN || window.userRole === USER_ROLES.AGENT) {
    // Keep the first option (default)
    const defaultOption = brandFilter.querySelector('option[value=""]');
    brandFilter.innerHTML = '';
    if (defaultOption) {
      brandFilter.appendChild(defaultOption);
    } else {
      const newDefaultOption = document.createElement('option');
      newDefaultOption.value = '';
      newDefaultOption.textContent = 'כל הלקוחות';
      brandFilter.appendChild(newDefaultOption);
    }
    
    // Add available clients
    availableClients.forEach(client => {
      const option = document.createElement('option');
      option.value = client;
      option.textContent = client;
      if (client === currentBrand) {
        option.selected = true;
      }
      brandFilter.appendChild(option);
    });
  }

  // Update select styling
  updateSelectStyling(countryFilter);
  updateSelectStyling(categoryFilter);
  updateSelectStyling(brandFilter);
  updateSelectStyling(brandGroupFilter);
  updateSelectStyling(kosherFilter);
}

// Search input with improved debounce
searchInput.addEventListener('input', function() {
  clearTimeout(this.debounceTimer);
  const value = this.value;

  this.debounceTimer = setTimeout(() => {
    currentFilters.search = value;
    updateFilterStates();
    debouncedPopulateFilters('search-input');
    displayProducts();
  }, 300);
});

// Clear filter buttons with improved handling
clearCountryFilterBtn.addEventListener('click', function() {
  countryFilter.value = '';
  currentFilters.country = '';
  updateSelectStyling(countryFilter);
  updateFilterStates();
  debouncedPopulateFilters('country-filter');
  displayProducts();
});

clearCategoryFilterBtn.addEventListener('click', function() {
  categoryFilter.value = '';
  currentFilters.category = '';
  updateSelectStyling(categoryFilter);
  updateFilterStates();
  debouncedPopulateFilters('category-filter');
  displayProducts();
});

clearBrandFilterBtn.addEventListener('click', function() {
  brandFilter.value = '';
  currentFilters.brand = '';
  updateSelectStyling(brandFilter);
  updateFilterStates();
  debouncedPopulateFilters('brand-filter');
  displayProducts();
});

clearBrandGroupFilterBtn.addEventListener('click', function() {
  brandGroupFilter.value = '';
  currentFilters.brandGroup = '';
  updateSelectStyling(brandGroupFilter);
  updateFilterStates();
  debouncedPopulateFilters('brand-group-filter');
  displayProducts();
});

clearKosherFilterBtn.addEventListener('click', function() {
  kosherFilter.value = '';
  currentFilters.kosher = '';
  updateSelectStyling(kosherFilter);
  updateFilterStates();
  debouncedPopulateFilters('kosher-filter');
  displayProducts();
});

// Add a function to clear all filters with animation
function clearAllFilters() {
  console.log('Clearing all filters');
  const filterGroups = document.querySelectorAll('.filter-group');
  
  // Add fade-out animation to active filters
  filterGroups.forEach(group => {
    if (group.classList.contains('active')) {
      group.style.transition = 'opacity 0.3s ease';
      group.style.opacity = '0.5';
    }
  });
  
  // Clear all filter values
  currentFilters.country = '';
  currentFilters.category = '';
  currentFilters.brand = '';
  currentFilters.brandGroup = '';
  currentFilters.kosher = '';
  currentFilters.search = '';
  
  countryFilter.value = '';
  categoryFilter.value = '';
  brandFilter.value = '';
  brandGroupFilter.value = '';
  kosherFilter.value = '';
  searchInput.value = '';
  
  // Update styling and states
  updateSelectStyling(countryFilter);
  updateSelectStyling(categoryFilter);
  updateSelectStyling(brandFilter);
  updateSelectStyling(brandGroupFilter);
  updateSelectStyling(kosherFilter);
  
  // Reset open state for all filters
  [countryFilter, categoryFilter, brandFilter, brandGroupFilter, kosherFilter].forEach(filter => {
    filter.setAttribute('data-open', 'false');
  });
  
  // Reset opacity and update states
  setTimeout(() => {
    filterGroups.forEach(group => {
      group.style.opacity = '1';
    });
    updateFilterStates();
    
    // Get all products for the current tab and update filter options
    const products = getProductsByTab();
    updateFilterOptions(products);
    
    // Display all products
    displayProducts();
  }, 300);
}

// Add a clear all filters button to the HTML
const clearAllFiltersBtn = document.createElement('button');
clearAllFiltersBtn.id = 'clear-all-filters';
clearAllFiltersBtn.className = 'clear-all-filters';
clearAllFiltersBtn.innerHTML = 'נקה כל הפילטרים';
clearAllFiltersBtn.addEventListener('click', clearAllFilters);
document.querySelector('.filters').appendChild(clearAllFiltersBtn);