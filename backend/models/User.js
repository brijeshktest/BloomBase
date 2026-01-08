const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'seller', 'buyer'],
    default: 'buyer'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: function() { return this.role === 'seller'; }
  },
  // Seller phone verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationToken: {
    type: String
  },
  phoneVerificationExpiresAt: {
    type: Date
  },
  // Seller specific fields
  businessName: {
    type: String,
    trim: true
  },
  alias: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  theme: {
    type: String,
    enum: ['ocean', 'sunset', 'forest', 'midnight', 'rose', 'minimal'],
    default: 'minimal'
  },
  businessDescription: {
    type: String,
    maxlength: 500
  },
  businessLogo: String,
  businessBanner: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  // SEO fields
  seoMetaTitle: {
    type: String,
    maxlength: 60,
    trim: true
  },
  seoMetaDescription: {
    type: String,
    maxlength: 160,
    trim: true
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  seoLocalArea: {
    type: String,
    trim: true
  },
  // Social media handles
  instagramHandle: {
    type: String,
    trim: true
  },
  facebookHandle: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  trialEndsAt: {
    type: Date
  },
  // Track if account is suspended due to expired trial
  isSuspended: {
    type: Boolean,
    default: false
  },
  // Buyer specific - which seller's site they registered on
  registeredOnSeller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set trial period for sellers
userSchema.pre('save', function(next) {
  if (this.isNew && this.role === 'seller' && !this.trialEndsAt) {
    const trialEnd = new Date();
    trialEnd.setMonth(trialEnd.getMonth() + 1);
    this.trialEndsAt = trialEnd;
  }
  next();
});

// Method to check and auto-suspend if trial expired
userSchema.methods.checkAndSuspendIfExpired = async function() {
  if (this.role === 'seller' && this.trialEndsAt && new Date() > this.trialEndsAt) {
    if (!this.isSuspended) {
      this.isSuspended = true;
      this.isActive = false; // Also deactivate
      await this.save();
      return true; // Was suspended
    }
    return true; // Already suspended
  }
  return false; // Not suspended
};

// Static method to auto-suspend all expired sellers
userSchema.statics.autoSuspendExpiredSellers = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      role: 'seller',
      trialEndsAt: { $lt: now },
      isSuspended: false
    },
    {
      $set: {
        isSuspended: true,
        isActive: false
      }
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('User', userSchema);

