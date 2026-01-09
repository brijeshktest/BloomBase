/**
 * Broadcast Feature Check Utility
 * 
 * Checks if broadcasts are enabled at global and seller level
 */

const Config = require('../models/Config');
const User = require('../models/User');

/**
 * Check if broadcasts are enabled globally
 * @returns {Promise<Boolean>}
 */
async function isBroadcastsEnabledGlobally() {
  try {
    const enabled = await Config.getValue('broadcastsEnabled', true); // Default to enabled
    return enabled === true;
  } catch (error) {
    console.error('Error checking global broadcast setting:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Check if broadcasts are enabled for a specific seller
 * @param {String|Object} sellerId - Seller ID or seller object
 * @returns {Promise<Boolean>}
 */
async function isBroadcastsEnabledForSeller(sellerId) {
  try {
    // If sellerId is already a User object
    if (sellerId && typeof sellerId === 'object' && sellerId.broadcastsEnabled !== undefined) {
      return sellerId.broadcastsEnabled !== false; // Default to enabled if not set
    }
    
    // If sellerId is a string, fetch the seller
    const seller = await User.findById(sellerId).select('broadcastsEnabled');
    if (!seller) {
      return false;
    }
    
    return seller.broadcastsEnabled !== false; // Default to enabled if not set
  } catch (error) {
    console.error('Error checking seller broadcast setting:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Check if broadcasts are enabled (both globally and for seller)
 * @param {String|Object} sellerId - Seller ID or seller object
 * @returns {Promise<Object>} { enabled: boolean, reason?: string }
 */
async function checkBroadcastsEnabled(sellerId) {
  const globalEnabled = await isBroadcastsEnabledGlobally();
  
  if (!globalEnabled) {
    return {
      enabled: false,
      reason: 'Broadcasts are disabled globally by admin'
    };
  }
  
  const sellerEnabled = await isBroadcastsEnabledForSeller(sellerId);
  
  if (!sellerEnabled) {
    return {
      enabled: false,
      reason: 'Broadcasts are disabled for this seller by admin'
    };
  }
  
  return {
    enabled: true
  };
}

module.exports = {
  isBroadcastsEnabledGlobally,
  isBroadcastsEnabledForSeller,
  checkBroadcastsEnabled
};
