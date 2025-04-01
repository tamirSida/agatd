// Global variables
let alcoholProducts = [];
let wineProducts = [];
let foodProducts = [];
let allProducts = [];
let groupedProducts = {};
let currentFilters = {
  country: '',
  category: '',
  search: '',
  tab: 'all'
};

// DOM elements
const countryFilter = document.getElementById('country-filter');
const categoryFilter = document.getElementById('category-filter');
const searchInput = document.getElementById('search-input');
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
const ALCOHOL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlI9O1WgV9Dz79JHp91sRZIwQYZdv27z2UIXqyKjv3NFBJM3uhxI7C9594X5I-JWELSmE9dAvgHkaq/pub?output=csv';
const BEVERAGES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIwiMX0romQUhhGq9r_jSeXnbJfwjRdglTdAUK4rmeYUcw2vbLyCVb0rUGkydljl6dFqri9u4VuAtk/pub?output=csv';
const FOOD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0ql7J4DFk4nx-GcznXAMKgkrlGsbjlJ6M9y6m63Y3d7AKQ_10e3dqMeoVSX4L0SXl2QE3iG1-ni0O/pub?output=csv';

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Show loading indication
    productsContainer.innerHTML = '<p style="text-align: center;">Loading products...</p>';
    
    // Try to fetch from the online sources first, fall back to local files if needed
    try {
      // Fetch data from all CSV files concurrently
      const [alcoholResponse, beveragesResponse, foodResponse] = await Promise.all([
        fetch(ALCOHOL_CSV_URL),
        fetch(BEVERAGES_CSV_URL),
        fetch(FOOD_CSV_URL)
      ]);
      
      // Check if all responses are OK
      if (alcoholResponse.ok && beveragesResponse.ok && foodResponse.ok) {
        // Parse the CSV data
        const alcoholData = parseCSV(await alcoholResponse.text());
        const beveragesData = parseCSV(await beveragesResponse.text());
        const foodData = parseCSV(await foodResponse.text());
        
        // Set the product arrays
        alcoholProducts = alcoholData;
        wineProducts = beveragesData;
        foodProducts = foodData;
      } else {
        throw new Error('One or more CSV files failed to load from Google Sheets');
      }
    } catch (fetchError) {
      console.warn('Failed to fetch from Google Sheets, using local CSV files:', fetchError);
      
      // Fetch from local CSV files
      const [alcoholResponse, beveragesResponse, foodResponse] = await Promise.all([
        fetch('AGAT - Alcohol.csv'),
        fetch('AGAT - Beverages.csv'),
        fetch('AGAT - Food.csv')
      ]);
      
      // Parse the CSV data
      const alcoholData = parseCSV(await alcoholResponse.text());
      const beveragesData = parseCSV(await beveragesResponse.text());
      const foodData = parseCSV(await foodResponse.text());
      
      // Set the product arrays
      alcoholProducts = alcoholData;
      wineProducts = beveragesData;
      foodProducts = foodData;
    }
    
    // Combine all products
    allProducts = [...alcoholProducts, ...wineProducts, ...foodProducts];
    
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

// No longer needed - we fetch the CSV directly in init()

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
}

// Get products based on the current tab
function getProductsByTab() {
  switch (currentFilters.tab) {
    case 'alcohol':
      return alcoholProducts && alcoholProducts.length > 0 ? alcoholProducts : allProducts;
    case 'wine':
      return wineProducts && wineProducts.length > 0 ? wineProducts : allProducts;
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
      <img src="${imageUrl}" alt="${product['שם פריט אוטומטי'] || 'Product'}" onerror="if(this.src.includes('tl')){ this.src='media/${barcode || ''}.jpg'; } else { this.src='placeholder.jpg'; this.nextElementSibling.style.display='block'; }">
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
  
  // Set image - use media folder for modal (full size image)
  const barcode = product['ברקוד'];
  const imageUrl = barcode ? `media/${barcode}.jpg` : 'placeholder.jpg';
  modalImage.src = imageUrl;
  modalImage.alt = product['שם פריט אוטומטי'] || 'Product';
  modalImage.onerror = () => { 
    modalImage.src = 'placeholder.jpg'; 
    document.querySelector('.modal-image-not-found').style.display = 'block';
  };
  
  // Reset the display properties
  document.querySelector('.modal-image-not-found').style.display = 'none';
  
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
  
  // Add product specs
  for (const [key, value] of Object.entries(product)) {
    // Skip empty values and fields displayed elsewhere
    if (!value || key === 'שם פריט אוטומטי' || key === 'תאור' || key === 'כשרות' || key === 'מדינה' || 
        key === 'company' || key === 'קבוצה / מותג' || key === 'קבוצה / מותג אוטומטי') continue;
    
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
  countryFilter.value = '';
  categoryFilter.value = '';
  
  // Update filter options based on the new tab
  populateFilters();
  
  // Display filtered products
  displayProducts();
}


// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Filter change events
  countryFilter.addEventListener('change', function() {
    currentFilters.country = this.value;
    displayProducts();
  });
  
  categoryFilter.addEventListener('change', function() {
    currentFilters.category = this.value;
    displayProducts();
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
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeProductModal();
    }
  });
}