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
        pricelist: product.pricelist || product.מחירון || product['מחירון'] || null, // Include both price fields
        מחירון: product.מחירון || product['מחירון'] || null, // Keep original field for compatibility
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
      console.log(`Attempting to create notification for order ${orderRef.id} for agent ${clientData.agentId}`);
      try {
        // Create base notification data with ALL required fields for security rules
        const notificationData = {
          type: 'new_order',
          orderId: orderRef.id,
          clientId: user.uid,  // This is crucial for security rules to work
          clientEmail: user.email,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          senderId: user.uid,
          senderEmail: user.email,
          agentId: clientData.agentId // Include agentId for security rules
        };
        
        // Create notification for the agent first
        try {
          console.log(`Creating notification for agent: ${clientData.agentId}`);
          await db.collection('notifications').add({
            ...notificationData,
            recipientId: clientData.agentId,
            message: `הזמנה חדשה התקבלה מלקוח: ${user.email}`
          });
          console.log('Order notification created for agent successfully');
        } catch (agentNotifError) {
          console.error('Error creating agent notification:', agentNotifError);
          console.error('Agent notification error details:', agentNotifError.message);
        }
        
        // Create notifications for all admins
        console.log('Attempting to create notifications for admins...');
        try {
          const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
            
          console.log(`Found ${adminsSnapshot.size} admin users for notifications`);
          
          if (adminsSnapshot.empty) {
            console.warn('No admin users found in the database to send notifications to');
          } else {
            // Create notifications individually rather than using batch
            let adminCount = 0;
            let successCount = 0;
            
            // Use Promise.allSettled to handle each notification creation independently
            const adminPromises = [];
            
            for (const adminDoc of adminsSnapshot.docs) {
              adminCount++;
              const adminData = adminDoc.data();
              console.log(`Creating notification for admin ${adminDoc.id}, email: ${adminData.email || 'unknown'}`);
              
              try {
                // Create individual notification 
                const adminNotifPromise = db.collection('notifications').add({
                  ...notificationData,
                  recipientId: adminDoc.id,
                  message: `הזמנה חדשה התקבלה מלקוח: ${user.email}`
                });
                
                adminPromises.push(adminNotifPromise);
              } catch (singleAdminError) {
                console.error(`Error creating notification for admin ${adminDoc.id}:`, singleAdminError);
              }
            }
            
            if (adminPromises.length > 0) {
              console.log(`Processing ${adminPromises.length} admin notifications individually`);
              const results = await Promise.allSettled(adminPromises);
              successCount = results.filter(r => r.status === 'fulfilled').length;
              console.log(`Successfully created ${successCount} out of ${adminPromises.length} admin notifications`);
            }
          }
        } catch (adminBatchError) {
          console.error('Error creating admin notifications batch:', adminBatchError);
          console.error('Admin batch error details:', adminBatchError.message);
        }
      } catch (notifError) {
        console.error('Error in overall notification process:', notifError);
        console.error('Full error details:', notifError.message, notifError.stack);
        // Continue execution even if notification creation fails
      }
    } else {
      console.log('No agent assigned to this client. Creating admin notifications only.');
      
      try {
        // Create base notification data with ALL required fields for security rules
        const notificationData = {
          type: 'new_order',
          orderId: orderRef.id,
          clientId: user.uid,
          clientEmail: user.email,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          senderId: user.uid,
          senderEmail: user.email,
          agentId: null // Must include this field even when null
        };
        
        // Create notifications for all admins
        const adminsSnapshot = await db.collection('users')
          .where('role', '==', 'admin')
          .get();
          
        console.log(`Found ${adminsSnapshot.size} admin users to notify (no agent case)`);
        
        if (!adminsSnapshot.empty) {
          // Process notifications individually rather than in a batch
          let adminCount = 0;
          let successCount = 0;
          
          // Use Promise.allSettled to handle each notification creation independently
          const adminPromises = [];
          
          for (const adminDoc of adminsSnapshot.docs) {
            adminCount++;
            console.log(`Creating notification for admin ${adminDoc.id} (no agent case)`);
            
            try {
              // Create individual notification
              const adminNotifPromise = db.collection('notifications').add({
                ...notificationData,
                recipientId: adminDoc.id,
                message: `הזמנה חדשה התקבלה מלקוח: ${user.email} (ללא סוכן)`
              });
              
              adminPromises.push(adminNotifPromise);
            } catch (singleAdminError) {
              console.error(`Error creating notification for admin ${adminDoc.id} (no agent case):`, singleAdminError);
            }
          }
          
          if (adminPromises.length > 0) {
            console.log(`Processing ${adminPromises.length} admin notifications individually (no agent case)`);
            const results = await Promise.allSettled(adminPromises);
            successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Successfully created ${successCount} out of ${adminPromises.length} admin notifications (no agent case)`);
          }
        }
      } catch (adminNotifError) {
        console.error('Error creating admin notifications (no agent case):', adminNotifError);
        console.error('Error details (no agent case):', adminNotifError.message);
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