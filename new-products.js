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
  brandGroup: '', // Generic brand/group filter for all categories
  kosher: '', // Kosher filter 
  isNew: true // Always filter for new products on this page
};

// DOM elements
const countryFilter = document.getElementById('country-filter');
const categoryFilter = document.getElementById('category-filter');
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
const clearBrandGroupFilterBtn = document.getElementById('clear-brand-group-filter');
const clearKosherFilterBtn = document.getElementById('clear-kosher-filter');

// Cart modal elements
const cartModal = document.getElementById('cart-modal');
const cartModalImage = document.getElementById('cart-modal-image');
const cartModalTitle = document.getElementById('cart-modal-title');
const cartModalPrice = document.getElementById('cart-modal-price');
const quantityInput = document.getElementById('quantity-input');
const addToCartConfirmBtn = document.getElementById('add-to-cart-confirm');
const cancelCartBtn = document.getElementById('cancel-cart');

// CSV URLs for each product category
const ALCOHOL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGNZzh1kbP8nYSiVNDDsd198zJoo6725-WKPz7YUE-lVWXkdjn0r97SJAEOttnLoqAH5PSJRbDbRiB/pub?output=csv';
const WINE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkUmKUxQGkMSoLEhfkgdXBU6KGDDea6Z8crHPVeFEsYajhCUmSQevyTL_9WucAyhw2UnDfoFQXURCB/pub?output=csv';
const BEER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGFPOHiYkWGPDASiBePqXkbxoikcLYiFAz1RobyVTlX2-dj71jMSCCFLgrNXOjFpOZYwS7MHCD6IrU/pub?output=csv';
const FOOD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zrZyn-cmKHuk3H-nI4QG9NDJFvB-q3MjjdIUuQfk_lhtQPzTeovn_kAz46o2PnuH_aZ8Mq1zteFD/pub?output=csv';
const WHISKEY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnSgqeW3W-2vKiqPwsBLpOE9vamrHELbgZCNHDYv6bGGYPnkhp44KzYvbly7qCLq3E_Rgu2VyYKMGY/pub?output=csv';
const BRANDS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbLyJcDTPOjBtcGOSKUXYuKn5U8_sRF_KOSgFwiyPoeO3YazAxOhXXVCSK7M94-yxyO7j1fr5J3ou_/pub?output=csv';

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Show loading indication
    productsContainer.innerHTML = '<p style="text-align: center;">Loading new products...</p>';

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
    
    // Initialize the data-open attribute for all filters
    const filters = [countryFilter, categoryFilter, brandGroupFilter, kosherFilter];
    filters.forEach(filter => {
      if (filter) {
        filter.setAttribute('data-open', 'false');
      }
    });

    setupEventListeners();
    displayProducts();

  } catch (error) {
    console.error('Initialization error:', error);
    productsContainer.innerHTML = `
      <div style="text-align: center; color: red; padding: 20px;">
        <p>שגיאה בהפעלת האפליקציה</p>
        <p>פרטים: ${error.message}</p>
        <button id="retry-button" style="padding: 8px 15px; margin-top: 10px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">נסה שוב</button>
      </div>
    `;
    
    document.getElementById('retry-button')?.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// Load brands from CSV
async function loadBrands() {
  try {
    const response = await fetch(BRANDS_CSV_URL);
    if (response.ok) {
      const text = await response.text();
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      
      if (rows.length > 1) {
        const headers = rows[0].split(',').map(h => h.trim());
        brands = rows.slice(1).map(row => {
          const values = parseCSVRow(row);
          const brand = {};
          headers.forEach((header, index) => {
            brand[header] = values[index] || '';
          });
          return brand;
        });
        console.log('Loaded brands:', brands.length);
      }
    }
  } catch (error) {
    console.error('Error loading brands:', error);
    brands = [];
  }
}

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length === 0) return [];

  const headers = parseCSVRow(lines[0]);
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    if (values.length === 0) continue;

    const product = {};
    headers.forEach((header, index) => {
      product[header] = values[index] || '';
    });

    // Only include products marked as new (IsNew=TRUE)
    if (product.IsNew && product.IsNew.toLowerCase() === 'true') {
      products.push(product);
    }
  }

  return products;
}

// Helper function to parse a CSV row considering quotes and commas
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilters.tab = button.dataset.tab;
      displayProducts();
    });
  });

  // Filter event listeners
  if (countryFilter) {
    countryFilter.addEventListener('change', () => {
      currentFilters.country = countryFilter.value;
      displayProducts();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      currentFilters.category = categoryFilter.value;
      displayProducts();
    });
  }

  if (brandGroupFilter) {
    brandGroupFilter.addEventListener('change', () => {
      currentFilters.brandGroup = brandGroupFilter.value;
      displayProducts();
    });
  }

  if (kosherFilter) {
    kosherFilter.addEventListener('change', () => {
      currentFilters.kosher = kosherFilter.value;
      displayProducts();
    });
  }

  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentFilters.search = searchInput.value.trim();
      displayProducts();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentFilters.search = searchInput.value.trim();
        displayProducts();
      }
    });
  }

  // Clear filter buttons
  if (clearCountryFilterBtn) {
    clearCountryFilterBtn.addEventListener('click', () => {
      countryFilter.value = '';
      currentFilters.country = '';
      displayProducts();
    });
  }

  if (clearCategoryFilterBtn) {
    clearCategoryFilterBtn.addEventListener('click', () => {
      categoryFilter.value = '';
      currentFilters.category = '';
      displayProducts();
    });
  }

  if (clearBrandGroupFilterBtn) {
    clearBrandGroupFilterBtn.addEventListener('click', () => {
      brandGroupFilter.value = '';
      currentFilters.brandGroup = '';
      displayProducts();
    });
  }

  if (clearKosherFilterBtn) {
    clearKosherFilterBtn.addEventListener('click', () => {
      kosherFilter.value = '';
      currentFilters.kosher = '';
      displayProducts();
    });
  }

  // Modal close functionality
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
    if (event.target === cartModal) {
      cartModal.style.display = 'none';
    }
  });

  // Cart modal functionality
  if (cancelCartBtn) {
    cancelCartBtn.addEventListener('click', () => {
      cartModal.style.display = 'none';
    });
  }

  if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', handleAddToCart);
  }
}

// Filter products based on current filters
function filterProducts(products) {
  return products.filter(product => {
    // Always filter for new products only on this page
    if (!product.IsNew || product.IsNew.toLowerCase() !== 'true') {
      return false;
    }

    // Apply client brand restrictions if any
    if (window.clientAllowedBrands && window.clientAllowedBrands.length > 0) {
      const productBrand = product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג'] || '';
      if (!window.clientAllowedBrands.includes(productBrand)) {
        return false;
      }
    }

    // Country filter
    if (currentFilters.country) {
      const productCountry = product['ארץ יצור'] || product['מדינה'] || '';
      if (productCountry !== currentFilters.country) return false;
    }

    // Category filter
    if (currentFilters.category) {
      const productCategory = product['קטגוריה'] || product['סוג'] || '';
      if (productCategory !== currentFilters.category) return false;
    }

    // Brand group filter
    if (currentFilters.brandGroup) {
      const productBrandGroup = product['קבוצה / מותג'] || product['קבוצה / מותג אוטומטי'] || product['מותג'] || '';
      if (productBrandGroup !== currentFilters.brandGroup) return false;
    }

    // Kosher filter
    if (currentFilters.kosher) {
      const isKosher = product['כשרות'] || product['כשר'] || '';
      const kosherValue = isKosher.toLowerCase();
      
      if (currentFilters.kosher === 'true') {
        if (kosherValue !== 'כן' && kosherValue !== 'true' && kosherValue !== 'yes') return false;
      } else if (currentFilters.kosher === 'false') {
        if (kosherValue === 'כן' || kosherValue === 'true' || kosherValue === 'yes') return false;
      }
    }

    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const searchableFields = [
        product['שם פריט אוטומטי'] || '',
        product['מקט'] || '',
        product['תיאור פריט'] || '',
        product['תאור'] || '',
        product['קבוצה / מותג'] || '',
        product['קבוצה / מותג אוטומטי'] || '',
        product['מותג'] || '',
        product['ארץ יצור'] || '',
        product['מדינה'] || ''
      ];
      
      const matchesSearch = searchableFields.some(field => 
        field.toLowerCase().includes(searchTerm)
      );
      
      if (!matchesSearch) return false;
    }

    return true;
  });
}

// Get products for current tab
function getProductsForTab(tab) {
  switch (tab) {
    case 'alcohol':
      return alcoholProducts;
    case 'whiskey':
      return whiskeyProducts;
    case 'wine':
      return wineProducts;
    case 'beer':
      return beerProducts;
    case 'food':
      return foodProducts;
    case 'all':
    default:
      return allProducts;
  }
}

// Display products
function displayProducts() {
  const tabProducts = getProductsForTab(currentFilters.tab);
  const filteredProducts = filterProducts(tabProducts);

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = '<p style="text-align: center;">לא נמצאו מוצרים חדשים המתאימים לקריטריונים שנבחרו</p>';
    return;
  }

  // Group products by name/description for display
  const productGroups = {};
  filteredProducts.forEach(product => {
    const productName = getProductName(product);
    if (!productGroups[productName]) {
      productGroups[productName] = [];
    }
    productGroups[productName].push(product);
  });

  const productCards = Object.values(productGroups).map(group => 
    createProductCard(group[0], group)
  );

  productsContainer.innerHTML = productCards.join('');

  // Add click event listeners to product cards
  addProductCardEventListeners();
}

// Create product card HTML (EXACT COPY from app.js)
function createProductCard(product, variants = []) {
  const barcode = product['ברקוד'] || '';
  const productName = getProductName(product);
  const company = getProductCompany(product);
  
  // Check if client is restricted to specific brands
  let shouldShow = true;
  if (window.clientAllowedBrands && window.clientAllowedBrands.length > 0) {
    const productBrand = company.toLowerCase();
    shouldShow = window.clientAllowedBrands.some(brand => 
      productBrand.includes(brand.toLowerCase()) || brand.toLowerCase().includes(productBrand)
    );
  }
  
  if (!shouldShow) {
    return '';
  }

  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.barcode = barcode || '';

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
    'רוסיה': 'ru',
    'ברזיל': 'br',
    'ארגנטינה': 'ar',
    'צ\'ילה': 'cl',
    'אוסטרליה': 'au',
    'דרום אפריקה': 'za',
    'מקסיקו': 'mx',
    'קנדה': 'ca',
    'יוון': 'gr',
    'פורטוגל': 'pt',
    'אוסטריה': 'at',
    'שוויץ': 'ch',
    'בלגיה': 'be',
    'הולנד': 'nl',
    'דנמרק': 'dk',
    'שבדיה': 'se',
    'נורבגיה': 'no',
    'פינלנד': 'fi',
    'איסלנד': 'is',
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
  } else if (product['מחיר']) {
    // Fallback to the existing מחיר field
    priceHtml = `<span class="price">${product['מחיר']} ₪</span>`;
  } else if (currentFilters.brand && product[currentFilters.brand] === 'TRUE') {
    // Show availability for selected client
    priceHtml = `<span class="availability available">זמין</span>`;
  }

  const imageUrl = barcode ? getCloudinaryImageUrl(barcode) : 'images/logo.png';
  
  // Check if user has liked this product
  const isLiked = window.userLikes && window.userLikes.includes(barcode);
  
  // Show client buttons only for clients
  const showClientButtons = window.userRole === USER_ROLES.CLIENT;
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${productName}" onerror="if(this.src.includes('cloudinary')){ this.src='tl/${barcode || ''}.jpg'; } else if(this.src.includes('tl/')){ this.src='media/${barcode || ''}.jpg'; } else if(this.src.includes('media/')){ this.src='images/logo.png'; this.nextElementSibling.style.display='block'; }">
      <div class="image-not-found">image not found</div>
      ${product['IsNew'] && product['IsNew'].toLowerCase() === 'true' ? '<span class="new-notification-badge">חדש!</span>' : ''}
      ${showClientButtons ? 
        `<div class="product-buttons">
          <button class="heart-button ${isLiked ? 'liked' : ''}" data-barcode="${barcode || ''}"><i class="${isLiked ? 'fas' : 'far'} fa-heart"></i></button>
          <button class="cart-button" data-barcode="${barcode || ''}" data-product-name="${productName.replace(/"/g, '&quot;')}" data-price="${product['מחיר'] || '0'}" data-pricelist="${product['מחירון'] || ''}"><i class="fas fa-shopping-cart"></i></button>
        </div>` 
        : ''}
    </div>
    <div class="product-info">
      <h3>${productName}</h3>
      <div class="product-company">${company}</div>
      <div class="product-country">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה'] || ''}</span>
      </div>
      <div class="kosher-tags">
        ${(product['כשרות'] === 'כשר' || product['כשר'] === 'כשר') ? '<div class="kosher-status kosher-yes">כשר</div>' : ''}
        ${(product['כשרות'] === 'לא כשר' || product['כשר'] === 'לא כשר') ? '<div class="kosher-status kosher-no">לא כשר</div>' : ''}
      </div>
      
      ${getProductVolume(product) ? `<div class="product-volume"><strong>נפח</strong>: ${getProductVolume(product)}</div>` : ''}
      ${getProductWeight(product) ? `<div class="product-weight"><strong>נפח</strong>: ${getProductWeight(product)}</div>` : ''}
      
      <div class="product-details">
        <span class="barcode">${barcode}</span>
        ${priceHtml}
      </div>
    </div>
  `;

  return card.outerHTML;
}

// Add event listeners to product cards
function addProductCardEventListeners() {
  const productCards = document.querySelectorAll('.product-card');
  
  // Handle card click to open modal (same logic as main catalog)
  const handleCardClick = (e) => {
    // Don't open modal if heart button or cart button was clicked
    if (
      e.target.closest('.heart-button') ||
      e.target.classList.contains('fa-heart') ||
      e.target.closest('.cart-button') ||
      e.target.classList.contains('cart-icon')
    ) {
      e.stopPropagation();
      return;
    }
    
    const barcode = e.currentTarget.dataset.barcode;
    openProductModal(barcode);
  };
  
  productCards.forEach(card => {
    card.removeEventListener('click', handleCardClick);
    card.addEventListener('click', handleCardClick);
  });
  
  // Add heart button event listeners
  const heartButtons = document.querySelectorAll('.heart-button');
  heartButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      const barcode = this.dataset.barcode;
      if (!barcode) return;
      
      try {
        // Toggle like in Firebase
        const isLiked = await toggleProductLike(barcode);
        
        const heartIcon = this.querySelector('.fa-heart');
        
        // Update UI
        if (isLiked) {
          this.classList.add('liked');
          heartIcon.className = 'fas fa-heart'; // Filled heart
          
          // Update modal heart button if open
          const modalHeartButton = document.querySelector('.modal-heart-button');
          if (modalHeartButton && modalHeartButton.dataset.barcode === barcode) {
            modalHeartButton.classList.add('liked');
            const heartIcon = modalHeartButton.querySelector('.fa-heart');
            if (heartIcon) heartIcon.className = 'fas fa-heart';
          }
        } else {
          this.classList.remove('liked');
          heartIcon.className = 'far fa-heart'; // Empty heart
          
          // Update modal heart button if open
          const modalHeartButton = document.querySelector('.modal-heart-button');
          if (modalHeartButton && modalHeartButton.dataset.barcode === barcode) {
            modalHeartButton.classList.remove('liked');
            const heartIcon = modalHeartButton.querySelector('.fa-heart');
            if (heartIcon) heartIcon.className = 'far fa-heart';
          }
        }
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    });
  });
  
  // Add cart button event listeners
  const cartButtons = document.querySelectorAll('.cart-button');
  cartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      const barcode = this.dataset.barcode;
      const productName = this.dataset.productName;
      const price = this.dataset.price;
      const pricelist = this.dataset.pricelist;
      
      if (!barcode) return;
      
      openCartModal(barcode, productName, price, pricelist);
    });
  });
}

// Open product modal (same logic as main catalog)
function openProductModal(barcode) {
  const product = allProducts.find(p => (p['ברקוד'] || p['מספר פריט']) === barcode);
  if (!product) return;

  const productName = getProductName(product);
  const company = getProductCompany(product);
  
  modalTitle.textContent = productName;
  if (company) {
    modalCompany.textContent = company;
  }
  modalDescription.textContent = getProductDescription(product);

  // Set image - use high-quality Cloudinary URL for modal
  const imageUrl = barcode ? getCloudinaryImageUrlHQ(barcode) : 'images/logo.png';
  modalImage.src = imageUrl;
  modalImage.alt = productName || 'Product';

  // Reset the image not found message
  document.querySelector('.modal-image-not-found').style.display = 'none';

  // Handle image error - try alternative folders before showing error
  modalImage.onerror = function() {
    if (this.src.includes('cloudinary')) {
      // If Cloudinary failed, try local tl/ folder
      this.src = `tl/${barcode}.jpg`;
    } else if (this.src.includes('tl/')) {
      // If tl/ folder failed, try media/ folder
      this.src = `media/${barcode}.jpg`;
    } else if (this.src.includes('media/')) {
      // If media/ folder also failed, use placeholder and show error
      this.src = 'images/logo.png';
      document.querySelector('.modal-image-not-found').style.display = 'block';
    }
  };

  // Clear previous modal content
  modalSpecs.innerHTML = '';
  modalVariants.innerHTML = '';

  // Add product specifications
  const specs = [];
  
  if (product['ארץ יצור'] || product['מדינה']) {
    specs.push(`ארץ יצור: ${product['ארץ יצור'] || product['מדינה']}`);
  }
  
  if (product['כשרות'] || product['כשר']) {
    specs.push(`כשרות: ${product['כשרות'] || product['כשר']}`);
  }
  
  const volume = getProductVolume(product);
  if (volume) {
    specs.push(`נפח: ${volume}`);
  }
  
  const weight = getProductWeight(product);
  if (weight) {
    specs.push(`משקל: ${weight}`);
  }
  
  const price = getProductPrice(product);
  if (price) {
    specs.push(`מחיר: ${price}`);
  }

  if (specs.length > 0) {
    modalSpecs.innerHTML = '<h4>מפרטים:</h4><ul>' + 
      specs.map(spec => `<li>${spec}</li>`).join('') + 
      '</ul>';
  }

  modal.style.display = 'block';
}

// Open cart modal
function openCartModal(barcode) {
  if (!window.userId || window.userRole !== USER_ROLES.CLIENT) {
    alert('רק לקוחות רשומים יכולים להוסיף מוצרים לעגלה');
    return;
  }

  const product = allProducts.find(p => (p['ברקוד'] || p['מספר פריט']) === barcode);
  if (!product) return;

  const productName = getProductName(product);
  const productImage = getProductImage(product);
  const productPrice = getProductPrice(product);

  cartModalTitle.textContent = productName;
  cartModalImage.src = productImage;
  cartModalPrice.textContent = productPrice || 'מחיר לא זמין';
  quantityInput.value = 1;
  
  // Store the barcode for later use
  cartModal.dataset.barcode = barcode;
  
  cartModal.style.display = 'block';
}

// Handle add to cart
async function handleAddToCart() {
  if (!window.userId || window.userRole !== USER_ROLES.CLIENT) {
    alert('רק לקוחות רשומים יכולים להוסיף מוצרים לעגלה');
    return;
  }

  const barcode = cartModal.dataset.barcode;
  const quantity = parseInt(quantityInput.value) || 1;
  
  if (quantity < 1) {
    alert('כמות חייבת להיות לפחות 1');
    return;
  }

  const product = allProducts.find(p => (p['ברקוד'] || p['מספר פריט']) === barcode);
  if (!product) return;

  try {
    const cartItem = {
      barcode: barcode,
      name: getProductName(product),
      company: getProductCompany(product),
      price: product['מחיר'] || '',
      priceList: product['מחירון'] || '',
      quantity: quantity,
      image: getProductImage(product),
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Get current cart
    const clientDoc = await db.collection('clients').doc(window.userId).get();
    const currentCart = clientDoc.exists ? (clientDoc.data().cart || []) : [];

    // Check if item already exists in cart
    const existingItemIndex = currentCart.findIndex(item => item.barcode === barcode);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      currentCart.push(cartItem);
    }

    // Update cart in Firestore
    await db.collection('clients').doc(window.userId).update({
      cart: currentCart
    });

    cartModal.style.display = 'none';
    alert('המוצר נוסף לעגלה בהצלחה!');

  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('שגיאה בהוספה לעגלה. אנא נסה שוב.');
  }
}

// Toggle like status
async function toggleLike(barcode) {
  if (!window.userId) {
    alert('יש להתחבר כדי לשמור מוצרים במועדפים');
    return;
  }

  try {
    const clientDoc = await db.collection('clients').doc(window.userId).get();
    const currentLikes = clientDoc.exists ? (clientDoc.data().likes || []) : [];
    
    let updatedLikes;
    if (currentLikes.includes(barcode)) {
      // Remove from likes
      updatedLikes = currentLikes.filter(like => like !== barcode);
    } else {
      // Add to likes
      updatedLikes = [...currentLikes, barcode];
    }

    // Update likes in Firestore
    await db.collection('clients').doc(window.userId).update({
      likes: updatedLikes
    });

    // Update global likes array
    window.userLikes = updatedLikes;

    // Update UI
    const likeButton = document.querySelector(`[data-barcode="${barcode}"]`);
    if (likeButton) {
      if (updatedLikes.includes(barcode)) {
        likeButton.classList.add('liked');
      } else {
        likeButton.classList.remove('liked');
      }
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    alert('שגיאה בעדכון המועדפים. אנא נסה שוב.');
  }
}

// Update filter options based on available products
function updateFilterOptions(products) {
  // Update country filter
  const countries = [...new Set(products.map(p => p['ארץ יצור'] || p['מדינה']).filter(Boolean))].sort();
  updateSelectOptions(countryFilter, countries);

  // Update category filter
  const categories = [...new Set(products.map(p => p['קטגוריה'] || p['סוג']).filter(Boolean))].sort();
  updateSelectOptions(categoryFilter, categories);

  // Update brand group filter
  const brandGroups = [...new Set(products.map(p => p['קבוצה / מותג'] || p['קבוצה / מותג אוטומטי'] || p['מותג']).filter(Boolean))].sort();
  updateSelectOptions(brandGroupFilter, brandGroups);
}

// Helper function to update select options
function updateSelectOptions(selectElement, options) {
  if (!selectElement) return;
  
  const currentValue = selectElement.value;
  const firstOption = selectElement.children[0];
  
  selectElement.innerHTML = '';
  selectElement.appendChild(firstOption);
  
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
  
  if (currentValue && options.includes(currentValue)) {
    selectElement.value = currentValue;
  }
}

// Group products by name for variant handling
function groupProductsByName() {
  groupedProducts = {};
  allProducts.forEach(product => {
    const name = getProductName(product);
    if (!groupedProducts[name]) {
      groupedProducts[name] = [];
    }
    groupedProducts[name].push(product);
  });
}

// Helper functions for product data extraction
function getProductName(product) {
  return product['שם פריט אוטומטי'] || 
         product['מקט'] || 
         product['תיאור פריט'] || 
         product['תאור'] || 
         'ללא שם';
}

function getProductCompany(product) {
  return product['קבוצה / מותג'] || 
         product['קבוצה / מותג אוטומטי'] || 
         product['מותג'] || '';
}

function getProductDescription(product) {
  return product['תאור'] || 
         product['תיאור פריט'] || 
         product['תיאור'] || '';
}

function getProductImage(product) {
  const barcode = product['ברקוד'] || product['מספר פריט'] || 'default';
  return `tl/${barcode}.jpg`;
}

function getProductPrice(product) {
  const priceList = product['מחירון'];
  const regularPrice = product['מחיר'];
  
  if (priceList && priceList.trim() !== '') {
    return `${priceList} ₪`;
  } else if (regularPrice && regularPrice.trim() !== '') {
    return `${regularPrice} ₪`;
  }
  return '';
}

function getProductVolume(product) {
  const volume = product['נפח'] || product['נפח בקבוק'] || '';
  return volume ? `${volume}` : '';
}

function getProductWeight(product) {
  const weight = product['משקל'] || product['משקל נטו'] || '';
  return weight ? `${weight}` : '';
}

function getProductKosher(product) {
  const kosher = product['כשרות'] || product['כשר'] || '';
  if (kosher.toLowerCase() === 'כן' || kosher.toLowerCase() === 'true' || kosher.toLowerCase() === 'yes') {
    return 'כשר';
  } else if (kosher.toLowerCase() === 'לא' || kosher.toLowerCase() === 'false' || kosher.toLowerCase() === 'no') {
    return 'לא כשר';
  }
  return '';
}

function getFlagIcon(country) {
  const flagMap = {
    'ישראל': '🇮🇱',
    'צרפת': '🇫🇷',
    'איטליה': '🇮🇹',
    'ספרד': '🇪🇸',
    'גרמניה': '🇩🇪',
    'אנגליה': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'סקוטלנד': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'ארצות הברית': '🇺🇸',
    'יפן': '🇯🇵',
    'מקסיקו': '🇲🇽',
    'ארגנטינה': '🇦🇷',
    'צ\'ילה': '🇨🇱',
    'אוסטרליה': '🇦🇺',
    'דרום אפריקה': '🇿🇦',
    'קנדה': '🇨🇦',
    'אירלנד': '🇮🇪',
    'פורטוגל': '🇵🇹',
    'יוון': '🇬🇷',
    'רוסיא': '🇷🇺',
    'אוקראינה': '🇺🇦',
    'פולין': '🇵🇱',
    'הונגריה': '🇭🇺',
    'רומניה': '🇷🇴',
    'בולגריה': '🇧🇬',
    'קרואטיה': '🇭🇷',
    'סרביה': '🇷🇸',
    'סלובניה': '🇸🇮',
    'צ\'כיה': '🇨🇿',
    'סלובקיה': '🇸🇰',
    'אוסטריה': '🇦🇹',
    'שוויץ': '🇨🇭',
    'בלגיה': '🇧🇪',
    'הולנד': '🇳🇱',
    'דנמרק': '🇩🇰',
    'שבדיה': '🇸🇪',
    'נורבגיה': '🇳🇴',
    'פינלנד': '🇫🇮',
    'איסלנד': '🇮🇸',
    'מלטה': '🇲🇹',
    'קפריסין': '🇨🇾',
    'לבנון': '🇱🇧',
    'טורקיה': '🇹🇷',
    'ארמניה': '🇦🇲',
    'גיאורגיה': '🇬🇪'
  };
  return flagMap[country] || '🏳️';
}

// Get country code for flag
function getCountryCode(country) {
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
    'רוסיה': 'ru',
    'ברזיל': 'br',
    'ארגנטינה': 'ar',
    'צ\'ילה': 'cl',
    'אוסטרליה': 'au',
    'דרום אפריקה': 'za',
    'מקסיקו': 'mx',
    'קנדה': 'ca',
    'יוון': 'gr',
    'פורטוגל': 'pt',
    'אוסטריה': 'at',
    'שוויץ': 'ch',
    'בלגיה': 'be',
    'הולנד': 'nl',
    'דנמרק': 'dk',
    'שבדיה': 'se',
    'נורבגיה': 'no',
    'פינלנד': 'fi',
    'איסלנד': 'is',
    'מלטה': 'mt',
    'קניה': 'ke',
    'סלובניה': 'si'
  };
  return countryToCode[country] || '';
}

// Get product price list (מחירון field)
function getProductPriceList(product) {
  return product['מחירון'] || '';
}

// Get availability status for current client
function getAvailabilityStatus(product) {
  if (currentFilters.brand && product[currentFilters.brand]) {
    return product[currentFilters.brand] === 'TRUE' ? 'זמין' : 'לא זמין';
  }
  return '';
}

// Cloudinary image URL function (same as in cloudinary-config.js)
function getCloudinaryImageUrl(barcode, options = {}) {
  if (!barcode) return 'images/logo.png';
  
  // Default transformations for optimization
  const defaultOptions = {
    f_auto: true,      // Auto format (WebP when supported)
    q_auto: true,      // Auto quality
    c_fill: true,      // Fill mode
    w_300: true,       // Max width 300px for cards
    h_300: true        // Max height 300px for cards
  };
  
  const allOptions = { ...defaultOptions, ...options };
  
  // Build transformation string
  const transformations = Object.entries(allOptions)
    .filter(([key, value]) => value === true)
    .map(([key]) => key)
    .join(',');
  
  const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/desbdkdi9/image/upload';
  return `${CLOUDINARY_BASE_URL}/${transformations ? transformations + '/' : ''}${barcode}.jpg`;
}

// Get high-quality image URL for modal view
function getCloudinaryImageUrlHQ(barcode) {
  return getCloudinaryImageUrl(barcode, {
    f_auto: true,
    q_auto: true,
    c_fit: true,
    w_800: true,
    h_600: true
  });
}