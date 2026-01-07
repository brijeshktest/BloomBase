const slugify = require('slugify');

const createSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

const createUniqueSlug = async (Model, text, sellerId, existingId = null) => {
  let slug = createSlug(text);
  let counter = 0;
  let uniqueSlug = slug;
  
  while (true) {
    const query = { seller: sellerId, slug: uniqueSlug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    
    const existing = await Model.findOne(query);
    if (!existing) break;
    
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }
  
  return uniqueSlug;
};

module.exports = { createSlug, createUniqueSlug };

