const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Note: Index on 'key' is already created by unique: true, so we don't need to add it again

// Static method to get config value
configSchema.statics.getValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ key });
  return config ? config.value : defaultValue;
};

// Static method to set config value
configSchema.statics.setValue = async function(key, value, description = null, updatedBy = null) {
  try {
    const updateData = {
      value,
      updatedAt: new Date()
    };
    
    if (description !== null) {
      updateData.description = description;
    }
    
    if (updatedBy !== null) {
      updateData.updatedBy = updatedBy;
    }
    
    const result = await this.findOneAndUpdate(
      { key },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error in Config.setValue:', error);
    throw error;
  }
};

module.exports = mongoose.model('Config', configSchema);
