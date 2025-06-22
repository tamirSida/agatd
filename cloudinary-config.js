// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'desbdkdi9',
  uploadPreset: 'product-images', // Must be Unsigned mode in Cloudinary dashboard
  apiKey: '949896835567628' // This will be extracted from your full URL
};

// Base Cloudinary URL for image delivery
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Get optimized image URL from Cloudinary
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

// Check if image exists in Cloudinary
async function checkCloudinaryImage(barcode) {
  try {
    const response = await fetch(getCloudinaryImageUrl(barcode), { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Initialize Cloudinary Upload Widget
function initCloudinaryWidget() {
  console.log('Initializing Cloudinary widget with:', {
    cloudName: CLOUDINARY_CONFIG.cloudName,
    uploadPreset: CLOUDINARY_CONFIG.uploadPreset
  });
  
  return cloudinary.createUploadWidget({
    cloudName: 'desbdkdi9',
    uploadPreset: 'product-images',
    multiple: true,
    sources: ['local'],
    showPoweredBy: false,
    styles: {
      palette: {
        window: '#FFFFFF',
        sourceBg: '#F4F4F5',
        windowBorder: '#90A0B3',
        tabIcon: '#0E2F5A',
        inactiveTabIcon: '#69778A',
        menuIcons: '#5A616A',
        link: '#0433FF',
        action: '#339933',
        inProgress: '#0433FF',
        complete: '#339933',
        error: '#cc0000',
        textDark: '#000000',
        textLight: '#FFFFFF'
      }
    }
  }, (error, result) => {
    if (!error && result && result.event === 'success') {
      console.log('Upload successful:', result.info);
      
      // Track uploaded barcode
      const uploadedBarcode = result.info.public_id;
      if (!window.recentlyUploadedBarcodes) {
        window.recentlyUploadedBarcodes = [];
      }
      window.recentlyUploadedBarcodes.unshift(uploadedBarcode);
      
      // Keep only last 10 uploaded barcodes
      window.recentlyUploadedBarcodes = window.recentlyUploadedBarcodes.slice(0, 10);
      
      // Show success message
      alert(`✅ תמונה הועלתה בהצלחה: ${uploadedBarcode}`);
      
      // Refresh the image management interface
      if (typeof refreshImageGrid === 'function') {
        setTimeout(refreshImageGrid, 1000); // Small delay to ensure Cloudinary processing
      }
    }
    if (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    }
  });
}