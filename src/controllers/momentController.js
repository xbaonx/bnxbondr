const admin = require('firebase-admin');

// Get latest moments from friends
exports.getLatestMoments = async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const db = admin.firestore();
    
    // Get user's friends
    const friendshipQuery = await db.collection('friendships')
      .where('users', 'array-contains', currentUserId)
      .where('status', '==', 'accepted')
      .get();
    
    const friendIds = [];
    friendshipQuery.forEach(doc => {
      const friendship = doc.data();
      const friendId = friendship.users[0] === currentUserId ? friendship.users[1] : friendship.users[0];
      friendIds.push(friendId);
    });
    
    // Include current user's own moments
    friendIds.push(currentUserId);
    
    // Get latest moments from each friend and current user
    const moments = [];
    
    for (const userId of friendIds) {
      const momentQuery = await db.collection('moments')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!momentQuery.empty) {
        const momentDoc = momentQuery.docs[0];
        const momentData = momentDoc.data();
        
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        
        moments.push({
          id: momentDoc.id,
          imageUrl: momentData.imageUrl || null,
          videoUrl: momentData.videoUrl || null,
          caption: momentData.caption || '',
          createdAt: momentData.createdAt.toDate(),
          user: {
            id: userId,
            name: userData.name || '',
            username: userData.username || '',
            avatar: userData.avatar || ''
          }
        });
      }
    }
    
    // Sort by creation time (newest first)
    moments.sort((a, b) => b.createdAt - a.createdAt);
    
    return res.json({ moments });
  } catch (error) {
    console.error('Error fetching moments:', error);
    return res.status(500).json({ error: 'Failed to fetch latest moments' });
  }
};

// Create a new moment
exports.createMoment = async (req, res) => {
  try {
    const { imageUrl, videoUrl, caption } = req.body;
    const userId = req.user.uid;
    
    if (!imageUrl && !videoUrl) {
      return res.status(400).json({ error: 'Either image or video URL is required' });
    }
    
    const db = admin.firestore();
    
    // Create new moment
    const momentRef = await db.collection('moments').add({
      userId,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      caption: caption || '',
      likes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get friend IDs to notify
    const friendshipQuery = await db.collection('friendships')
      .where('users', 'array-contains', userId)
      .where('status', '==', 'accepted')
      .get();
    
    const friendIds = [];
    friendshipQuery.forEach(doc => {
      const friendship = doc.data();
      const friendId = friendship.users[0] === userId ? friendship.users[1] : friendship.users[0];
      friendIds.push(friendId);
    });
    
    // Create notifications for friends
    const notificationBatch = db.batch();
    
    for (const friendId of friendIds) {
      const notificationRef = db.collection('notifications').doc();
      notificationBatch.set(notificationRef, {
        userId: friendId,
        type: 'new_moment',
        fromUserId: userId,
        read: false,
        data: {
          momentId: momentRef.id
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await notificationBatch.commit();
    
    return res.json({ 
      success: true, 
      momentId: momentRef.id,
      message: 'Moment created successfully' 
    });
  } catch (error) {
    console.error('Error creating moment:', error);
    return res.status(500).json({ error: 'Failed to create moment' });
  }
};
