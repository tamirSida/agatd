// Global variables
let allProducts = [];
let groupedProducts = {};
let currentFilters = {
  country: '',
  category: '',
  search: ''
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

// CSV URL (Google Sheets published as CSV)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIwiMX0romQUhhGq9r_jSeXnbJfwjRdglTdAUK4rmeYUcw2vbLyCVb0rUGkydljl6dFqri9u4VuAtk/pub?output=csv';

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Fetch and parse CSV data
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    allProducts = parseCSV(csvText);
    
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
    const key = product.company 
      ? `${product['שם פריט אוטומטי'].trim().toLowerCase()}_${product.company.trim().toLowerCase()}`
      : product['שם פריט אוטומטי'].trim().toLowerCase();
    
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
  // Get unique countries and categories
  const countries = [...new Set(allProducts.filter(p => p['מדינה']).map(p => p['מדינה']))];
  const categories = [...new Set(allProducts.filter(p => p['קטגוריה']).map(p => p['קטגוריה']))];
  
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

// Filter products based on current filters
function getFilteredProducts() {
  return allProducts.filter(product => {
    // Country filter
    if (currentFilters.country && product['מדינה'] !== currentFilters.country) {
      return false;
    }
    
    // Category filter
    if (currentFilters.category && product['קטגוריה'] !== currentFilters.category) {
      return false;
    }
    
    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const nameMatch = product['שם פריט אוטומטי'] && product['שם פריט אוטומטי'].toLowerCase().includes(searchLower);
      const descMatch = product['תאור'] && product['תאור'].toLowerCase().includes(searchLower);
      const companyMatch = product.company && product.company.toLowerCase().includes(searchLower);
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
    productsContainer.innerHTML = '<p style="text-align: center;">No products found matching your criteria.</p>';
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
  
  return product.company
    ? `${product['שם פריט אוטומטי'].trim().toLowerCase()}_${product.company.trim().toLowerCase()}`
    : product['שם פריט אוטומטי'].trim().toLowerCase();
}

// Create product card element
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Get image URL based on barcode
  const imageUrl = product['ברקוד'] ? `media/${product['ברקוד']}.jpg` : 'placeholder.jpg';
  
  // Determine kosher status and class
  const isKosher = product['כשר'] && product['כשר'].toLowerCase() === 'כן';
  const kosherStatusClass = isKosher ? 'kosher-yes' : 'kosher-no';
  const kosherText = isKosher ? 'כשר' : 'לא כשר';
  
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
  };
  
  const countryCode = product['מדינה'] && countryToCode[product['מדינה']] ? countryToCode[product['מדינה']] : '';
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${product['שם פריט אוטומטי'] || 'Product'}" onerror="this.src='placeholder.jpg'; this.nextElementSibling.style.display='block';">
      <div class="image-not-found">image not found</div>
    </div>
    <div class="product-info">
      <h3>${product['שם פריט אוטומטי'] || 'Unnamed Product'}</h3>
      ${product['מדינה'] ? `<div class="product-country">
        ${countryCode ? `<img class="country-flag" src="https://flagcdn.com/24x18/${countryCode}.png" alt="${product['מדינה']} flag">` : ''}
        <span class="country-name">${product['מדינה']}</span>
      </div>` : ''}
      <div class="kosher-status ${kosherStatusClass}">${kosherText}</div>
      ${product['תאור'] ? `<div class="product-description">${product['תאור']}</div>` : ''}
      ${product['נפח'] ? `<div class="product-volume">${product['נפח']}</div>` : ''}
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
  
  // Set modal content
  modalTitle.textContent = product['שם פריט אוטומטי'] || 'Unnamed Product';
  modalCompany.textContent = product.company || '';
  modalDescription.textContent = product['תאור'] || '';
  
  // Set image
  const imageUrl = product['ברקוד'] ? `media/${product['ברקוד']}.jpg` : 'placeholder.jpg';
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
  if (product['כשר'] !== undefined) {
    const isKosher = product['כשר'] && product['כשר'].toLowerCase() === 'כן';
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
    if (!value || key === 'name' || key === 'description' || key === 'company') continue;
    
    const specItem = document.createElement('div');
    specItem.className = 'spec-item';
    
    specItem.innerHTML = `
      <div class="spec-label">${key.charAt(0).toUpperCase() + key.slice(1)}:</div>
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
      
      variantOption.textContent = variant.volume || 'Standard';
      
      variantOption.addEventListener('click', () => {
        openProductModal(variant);
      });
      
      modalVariants.appendChild(variantOption);
    });
  }
  
  // Show modal
  modal.style.display = 'block';
}

// Close product modal
function closeProductModal() {
  modal.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
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
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeProductModal();
    }
  });
}