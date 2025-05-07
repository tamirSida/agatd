// Firebase configuration - Use environment variables if available
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' && process.env.FIREBASE_API_KEY || "AIzaSyDASzvsx7igxJ0FQe2ikv-WLt7l05tahPw",
  authDomain: typeof process !== 'undefined' && process.env.FIREBASE_AUTH_DOMAIN || "agatd-e37c7.firebaseapp.com",
  projectId: typeof process !== 'undefined' && process.env.FIREBASE_PROJECT_ID || "agatd-e37c7",
  storageBucket: typeof process !== 'undefined' && process.env.FIREBASE_STORAGE_BUCKET || "agatd-e37c7.firebasestorage.app",
  messagingSenderId: typeof process !== 'undefined' && process.env.FIREBASE_MESSAGING_SENDER_ID || "1005336153638",
  appId: typeof process !== 'undefined' && process.env.FIREBASE_APP_ID || "1:1005336153638:web:8838a025f3b8f171ca60e7",
  measurementId: typeof process !== 'undefined' && process.env.FIREBASE_MEASUREMENT_ID || "G-SL0XPS0WGM"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  CLIENT: 'client'
};

// Helper functions for authentication
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Get user role from Firestore
const getUserRole = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Check if current user is admin
const isAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const role = await getUserRole(user.uid);
  return role === USER_ROLES.ADMIN;
};

// Check if current user is agent
const isAgent = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const role = await getUserRole(user.uid);
  return role === USER_ROLES.AGENT;
};

// Check if current user is client
const isClient = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const role = await getUserRole(user.uid);
  return role === USER_ROLES.CLIENT;
};

// Get all clients for an agent
const getAgentClients = async (agentId) => {
  try {
    const clientsSnapshot = await db.collection('clients')
      .where('agentId', '==', agentId)
      .get();
    
    return clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting agent clients:', error);
    return [];
  }
};

// Get client allowed brands
const getClientAllowedBrands = async (clientId) => {
  try {
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (clientDoc.exists) {
      return clientDoc.data().allowedBrands || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting client allowed brands:', error);
    return [];
  }
};

// Check if user has liked a product
const hasUserLikedProduct = async (userId, barcode) => {
  try {
    const clientDoc = await db.collection('clients').doc(userId).get();
    if (clientDoc.exists) {
      const likes = clientDoc.data().likes || [];
      return likes.includes(barcode);
    }
    return false;
  } catch (error) {
    console.error('Error checking if user liked product:', error);
    return false;
  }
};

// Toggle like for a product
const toggleProductLike = async (barcode) => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const clientRef = db.collection('clients').doc(user.uid);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      console.error('Client document does not exist');
      return false;
    }
    
    const likes = clientDoc.data().likes || [];
    const isLiked = likes.includes(barcode);
    
    if (isLiked) {
      // Remove from likes
      await clientRef.update({
        likes: firebase.firestore.FieldValue.arrayRemove(barcode)
      });
    } else {
      // Add to likes
      await clientRef.update({
        likes: firebase.firestore.FieldValue.arrayUnion(barcode)
      });
    }
    
    return !isLiked; // Return new like status
  } catch (error) {
    console.error('Error toggling product like:', error);
    return false;
  }
};