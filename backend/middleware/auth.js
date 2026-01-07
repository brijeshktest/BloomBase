const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Auto-suspend if trial expired (for sellers)
    if (user.role === 'seller') {
      await user.checkAndSuspendIfExpired();
      // Refresh user data after potential suspension
      await user.populate();
    }
    
    if (!user.isActive) {
      if (user.isSuspended) {
        return res.status(403).json({ message: 'Your account has been suspended due to expired trial. Please contact admin to extend your subscription.' });
      }
      return res.status(401).json({ message: 'Account has been deactivated' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Check if user is seller
const sellerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    if (!req.user.isApproved) {
      return res.status(403).json({ message: 'Your account is pending approval' });
    }
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Seller only.' });
  }
};

// Check if seller trial is valid
const checkTrial = async (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    // Auto-suspend if expired
    const wasSuspended = await req.user.checkAndSuspendIfExpired();
    if (wasSuspended || req.user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended due to expired trial. Please contact admin to extend your subscription.' });
    }
  }
  next();
};

module.exports = { protect, adminOnly, sellerOnly, checkTrial };

