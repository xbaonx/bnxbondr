const admin = require('firebase-admin');

// Validate email address
exports.validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if email exists in Firebase Auth
    try {
      await admin.auth().getUserByEmail(email);
      return res.json({ exists: true, email });
    } catch (error) {
      // If error is auth/user-not-found, email doesn't exist
      if (error.code === 'auth/user-not-found') {
        return res.json({ exists: false, email });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error validating email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Send verification code via SMS
exports.sendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // In a real implementation, you would integrate with a service like Twilio
    // For now, we'll simulate success
    return res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await admin.auth().generatePasswordResetLink(email);
    return res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset:', error);
    return res.status(500).json({ error: 'Failed to send password reset email' });
  }
};

// Validate username
exports.validateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.uid;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const db = admin.firestore();
    
    // Check if username exists
    const usernameDoc = await db.collection('usernames').doc(username).get();
    
    if (usernameDoc.exists) {
      // If the username belongs to the current user, it's still available for them
      if (usernameDoc.data().userId === userId) {
        return res.json({ available: true, message: 'Username is yours' });
      }
      return res.json({ available: false, message: 'Username already taken' });
    }
    
    return res.json({ available: true, message: 'Username available' });
  } catch (error) {
    console.error('Error validating username:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Change profile information
exports.changeProfileInfo = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, username, bio, avatar } = req.body;
    const db = admin.firestore();
    
    // Get current user data
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        name: name || null,
        username: username || null,
        bio: bio || null,
        avatar: avatar || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing user document
      await userRef.update({
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Handle username update if provided
    if (username) {
      const currentUsername = userDoc.exists ? userDoc.data().username : null;
      
      // If username changed
      if (currentUsername !== username) {
        // Delete old username reference
        if (currentUsername) {
          await db.collection('usernames').doc(currentUsername).delete();
        }
        
        // Add new username reference
        await db.collection('usernames').doc(username).set({
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update username in user document
        await userRef.update({ username });
      }
    }
    
    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};
