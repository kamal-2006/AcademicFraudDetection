const Notification = require('../models/Notification');

// Get notifications for a user based on their role
exports.getNotifications = async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    const { role } = user;

    const notifications = await Notification.find({ targetRoles: role })
      .populate('studentId', 'name studentId email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Map to include a boolean isRead field for the current user
    const formattedNotifications = notifications.map(notif => {
      const isRead = notif.readBy.some(id => id.toString() === user._id.toString());
      return { ...notif.toObject(), isRead };
    });

    res.status(200).json({ success: true, count: formattedNotifications.length, data: formattedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Add user to readBy array if not already present
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Mark all notifications as read for the user
exports.markAllAsRead = async (req, res) => {
  try {
    const user = req.user;
    const { role } = user;

    // Find all unread notifications for the user's role
    const notifications = await Notification.find({
      targetRoles: role,
      readBy: { $ne: user._id }
    });

    const updatePromises = notifications.map(async (notif) => {
      notif.readBy.push(user._id);
      return notif.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Helper function to create a notification (to be used by other controllers)
exports.createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
