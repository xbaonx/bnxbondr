require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const admin = require('firebase-admin');

// Import routes
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const momentRoutes = require('./routes/momentRoutes');
const { setDemoMode } = require('./middleware/auth');

// Initialize Firebase Admin SDK
const serviceAccount = {
  "type": process.env.FIREBASE_TYPE || 'service_account',
  "project_id": process.env.FIREBASE_PROJECT_ID || '',
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID || '',
  "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  "client_email": process.env.FIREBASE_CLIENT_EMAIL || '',
  "client_id": process.env.FIREBASE_CLIENT_ID || '',
  "auth_uri": process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  "token_uri": process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL || ''
};

// Khởi tạo Firebase Admin SDK nếu có credentials, ngược lại dùng chế độ demo
let firebaseInitialized = false;

try {
  // Kiểm tra xem có đủ thông tin để khởi tạo Firebase không
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase credentials not found, running in demo mode');
    setDemoMode(true);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Bondr API',
    status: 'online',
    firebaseStatus: firebaseInitialized ? 'connected' : 'demo mode',
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply route middlewares
app.use('/', userRoutes);
app.use('/', friendRoutes);
app.use('/', momentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing
