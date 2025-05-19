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

// Shopping Cart Functions

// Add item to cart
const addToCart = async (product, quantity = 1) => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const clientRef = db.collection('clients').doc(user.uid);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      console.error('Client document does not exist');
      return false;
    }
    
    // Initialize cart if it doesn't exist
    let cart = clientDoc.data().cart || [];
    
    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex(item => item.barcode === product.barcode);
    
    if (existingProductIndex !== -1) {
      // Update quantity if product already exists
      cart[existingProductIndex].quantity += quantity;
    } else {
      // Get current timestamp for client-side use
      const now = new Date();
      
      // Add new product to cart
      cart.push({
        barcode: product.barcode,
        name: product.name || product['שם פריט אוטומטי'] || product['תיאור פריט'] || 'Unknown Product',
        price: product.price || product['מחיר'] || 0,
        pricelist: product.מחירון || product['מחירון'] || null, // Include the pricelist field
        quantity: quantity,
        category: product.category || '',
        image: `tl/${product.barcode}.jpg`, // Image path
        addedAt: now.toISOString() // Use ISO string format instead of server timestamp
      });
    }
    
    // Update cart in Firestore
    await clientRef.update({ cart });
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

// Update cart item quantity
const updateCartItemQuantity = async (barcode, quantity) => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const clientRef = db.collection('clients').doc(user.uid);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      console.error('Client document does not exist');
      return false;
    }
    
    let cart = clientDoc.data().cart || [];
    const itemIndex = cart.findIndex(item => item.barcode === barcode);
    
    if (itemIndex === -1) {
      console.error('Product not found in cart');
      return false;
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart[itemIndex].quantity = quantity;
    }
    
    // Update cart in Firestore
    await clientRef.update({ cart });
    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    return false;
  }
};

// Remove item from cart
const removeFromCart = async (barcode) => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const clientRef = db.collection('clients').doc(user.uid);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      console.error('Client document does not exist');
      return false;
    }
    
    let cart = clientDoc.data().cart || [];
    const updatedCart = cart.filter(item => item.barcode !== barcode);
    
    // Update cart in Firestore
    await clientRef.update({ cart: updatedCart });
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

// Get user's cart
const getUserCart = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  
  try {
    const clientDoc = await db.collection('clients').doc(user.uid).get();
    if (clientDoc.exists) {
      return clientDoc.data().cart || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user cart:', error);
    return [];
  }
};

// Submit order to agent
const submitOrder = async (notes = '') => {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const clientRef = db.collection('clients').doc(user.uid);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      console.error('Client document does not exist');
      return false;
    }
    
    const clientData = clientDoc.data();
    const cart = clientData.cart || [];
    
    if (cart.length === 0) {
      console.error('Cannot submit empty cart');
      return false;
    }
    
    // Make a deep copy of the cart array to avoid modifying the original reference
    const cartCopy = JSON.parse(JSON.stringify(cart));
    
    // Create an order
    const order = {
      clientId: user.uid,
      clientEmail: user.email,
      agentId: clientData.agentId || null,
      items: cartCopy, // Use the copied cart items
      notes: notes,
      status: 'pending', // pending, processing, completed, cancelled
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add order to orders collection
    const orderRef = await db.collection('orders').add(order);
    
    // Create notification for the agent
    if (clientData.agentId) {
      try {
        // Get user role to adjust notification strategy
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userRole = userDoc.exists ? userDoc.data().role : 'client'; // Default to client role
        
        console.log(`Creating notifications for order as user with role: ${userRole}`);
        
        // Create base notification data - make sure all required fields are present for security rules
        const notificationData = {
          type: 'new_order',
          orderId: orderRef.id,
          clientId: user.uid,  // This is crucial for security rules to work
          clientEmail: user.email,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          senderId: user.uid,
          senderEmail: user.email
        };
        
        // Create notification for the agent
        await db.collection('notifications').add({
          ...notificationData,
          recipientId: clientData.agentId,
          message: `הזמנה חדשה התקבלה מלקוח: ${user.email}`,
          agentId: clientData.agentId  // Include agentId for agent notifications
        });
        
        console.log('Order notification created for agent:', clientData.agentId);
        
        // Create notifications for all admins
        console.log('Attempting to create notifications for admins...');
        const adminsSnapshot = await db.collection('users')
          .where('role', '==', 'admin')
          .get();
          
        console.log(`Found ${adminsSnapshot.size} admin users for notifications`);
        
        // If no admins found, log it
        if (adminsSnapshot.empty) {
          console.warn('No admin users found in the database to send notifications to');
          // Check what users we do have for debugging
          const allUsers = await db.collection('users').get();
          console.log(`Total users in database: ${allUsers.size}`);
          allUsers.forEach(doc => {
            console.log(`User ${doc.id}: role=${doc.data().role || 'unknown'}, email=${doc.data().email || 'no-email'}`);
          });
        } else {
          // Create batch for notifications - this is more efficient than individual writes
          const batch = db.batch();
          
          adminsSnapshot.forEach(adminDoc => {
            const adminData = adminDoc.data();
            console.log(`Creating notification for admin ${adminDoc.id}, email: ${adminData.email || 'unknown'}`);
            
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
              ...notificationData,
              recipientId: adminDoc.id,
              message: `הזמנה חדשה התקבלה מלקוח: ${user.email}`,
              agentId: clientData.agentId || null // Include agentId for proper permissions
            });
          });
          
          await batch.commit();
          console.log('Order notifications successfully created for all admins');
        }
      } catch (notifError) {
        console.error('Error creating order notifications:', notifError);
        console.error('Full error details:', notifError.message, notifError.stack);
        // Continue execution even if notification creation fails
      }
    } else {
      console.log('No agent assigned to this client. Only admin notifications will be created.');
      
      try {
        // Create notifications for all admins
        const adminsSnapshot = await db.collection('users')
          .where('role', '==', 'admin')
          .get();
          
        if (!adminsSnapshot.empty) {
          const batch = db.batch();
          
          adminsSnapshot.forEach(adminDoc => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
              recipientId: adminDoc.id,
              message: `הזמנה חדשה התקבלה מלקוח: ${user.email} (ללא סוכן)`,
              type: 'new_order',
              orderId: orderRef.id,
              clientId: user.uid,
              clientEmail: user.email,
              read: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              agentId: null,
              senderId: user.uid,
              senderEmail: user.email
            });
          });
          
          await batch.commit();
          console.log('Order notifications created for admins (client has no agent)');
        }
      } catch (adminNotifError) {
        console.error('Error creating admin notifications (no agent case):', adminNotifError);
        // Continue execution even if notification creation fails
      }
    }
    
    // Clear user's cart
    await clientRef.update({ 
      cart: [],
      lastOrderId: orderRef.id,
      lastOrderDate: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return orderRef.id;
  } catch (error) {
    console.error('Error submitting order:', error);
    return false;
  }
};

// Get client orders (for agent/admin)
const getClientOrders = async (clientId) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting client orders:', error);
    return [];
  }
};

// Get agent's clients' orders
const getAgentOrders = async (agentId) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('agentId', '==', agentId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting agent orders:', error);
    return [];
  }
};

// Get all orders (admin only)
const getAllOrders = async () => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();
    
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all orders:', error);
    return [];
  }
};