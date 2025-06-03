const admin = require('firebase-admin');

// Variable to track if Firebase is initialized
let isDemoMode = false;

/**
 * Middleware to authenticate JWT token
 * Extracts and verifies the Firebase ID token from the Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    // If running in demo mode, use a simplified authentication
    if (isDemoMode) {
      console.log('Running in demo mode, accepting mock token');
      
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
      }
      
      // In demo mode, accept any token and use a mock user ID
      req.user = {
        uid: 'demo-user-id',
        email: 'demo@example.com',
        name: 'Demo User'
      };
      
      return next();
    }
    
    // Normal Firebase authentication flow
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

// Set demo mode status
exports.setDemoMode = (status) => {
  isDemoMode = status;
};

module.exports = { authenticateToken };
