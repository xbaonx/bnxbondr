const admin = require('firebase-admin');

// Fetch user information
exports.fetchUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.uid;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const db = admin.firestore();
    
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if users are friends
    const friendshipQuery = await db.collection('friendships')
      .where('users', 'array-contains', currentUserId)
      .where('status', '==', 'accepted')
      .get();
    
    let isFriend = false;
    
    friendshipQuery.forEach(doc => {
      const friendship = doc.data();
      if (friendship.users.includes(userId)) {
        isFriend = true;
      }
    });
    
    // Return user data with friendship status
    return res.json({
      user: {
        id: userId,
        name: userData.name || '',
        username: userData.username || '',
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        isFriend
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.uid;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }
    
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    const db = admin.firestore();
    
    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    
    if (!targetUserDoc.exists) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    // Check if friendship already exists
    const friendshipQuery = await db.collection('friendships')
      .where('users', 'array-contains', currentUserId)
      .get();
    
    let existingFriendship = null;
    
    friendshipQuery.forEach(doc => {
      const friendship = doc.data();
      if (friendship.users.includes(targetUserId)) {
        existingFriendship = { id: doc.id, ...friendship };
      }
    });
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends with this user' });
      } else if (existingFriendship.status === 'pending' && existingFriendship.requestedBy === currentUserId) {
        return res.status(400).json({ error: 'Friend request already sent' });
      } else if (existingFriendship.status === 'pending' && existingFriendship.requestedBy === targetUserId) {
        // Accept the incoming request instead
        await db.collection('friendships').doc(existingFriendship.id).update({
          status: 'accepted',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return res.json({ success: true, message: 'Friend request accepted' });
      }
    }
    
    // Create new friend request
    await db.collection('friendships').add({
      users: [currentUserId, targetUserId],
      status: 'pending',
      requestedBy: currentUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for target user
    await db.collection('notifications').add({
      userId: targetUserId,
      type: 'friend_request',
      fromUserId: currentUserId,
      read: false,
      data: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
};

// Get friend list
exports.getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const db = admin.firestore();
    
    // Get all accepted friendships
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
    
    // Get friend user data
    const friends = [];
    
    for (const friendId of friendIds) {
      const userDoc = await db.collection('users').doc(friendId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        friends.push({
          id: friendId,
          name: userData.name || '',
          username: userData.username || '',
          avatar: userData.avatar || ''
        });
      }
    }
    
    return res.json({ friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    return res.status(500).json({ error: 'Failed to get friends' });
  }
};
