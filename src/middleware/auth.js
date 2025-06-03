const admin = require('firebase-admin');

/**
 * Middleware to authenticate JWT token
 * Extracts and verifies the Firebase ID token from the Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
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

module.exports = { authenticateToken };
