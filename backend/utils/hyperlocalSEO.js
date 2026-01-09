/**
 * Hyperlocal SEO Utility
 * 
 * Generates location-based SEO metadata and keywords for seller microsites
 * to help them appear in local searches like "home bakers near me" or
 * "handmade gifts in [City]"
 */

/**
 * Generate hyperlocal SEO keywords based on location and business type
 * @param {Object} seller - Seller object with address and business info
 * @param {Array} productCategories - Array of product categories
 * @returns {Array} Array of SEO keywords
 */
function generateHyperlocalKeywords(seller, productCategories = []) {
  const keywords = [];
  const { address, businessName, seoLocalArea } = seller;
  
  // Extract location components
  const city = address?.city || seoLocalArea || '';
  const state = address?.state || '';
  const neighborhood = address?.street || seoLocalArea || '';
  
  // Common local search patterns
  const localPatterns = [
    'near me',
    'in {city}',
    '{city} {category}',
    '{category} {city}',
    '{neighborhood} {category}',
    'local {category}',
    '{category} delivery {city}',
    '{category} shop {city}',
    'best {category} {city}',
    'cheap {category} {city}',
    'wholesale {category} {city}',
    'home based {category} {city}',
    'online {category} {city}',
    '{category} seller {city}',
    '{category} supplier {city}',
    'buy {category} {city}',
    '{category} store {city}',
    '{category} shop near me',
    '{category} {city} {state}',
  ];
  
  // Generate keywords for each category
  productCategories.forEach(category => {
    if (!category) return;
    
    const categoryLower = category.toLowerCase();
    
    localPatterns.forEach(pattern => {
      let keyword = pattern
        .replace(/{city}/g, city.toLowerCase())
        .replace(/{state}/g, state.toLowerCase())
        .replace(/{neighborhood}/g, neighborhood.toLowerCase())
        .replace(/{category}/g, categoryLower);
      
      // Clean up and add if valid
      keyword = keyword.trim().replace(/\s+/g, ' ');
      if (keyword && keyword.length > 3 && !keywords.includes(keyword)) {
        keywords.push(keyword);
      }
    });
  });
  
  // Add business-specific keywords if business name exists
  if (businessName && city) {
    keywords.push(`${businessName.toLowerCase()} ${city.toLowerCase()}`);
    keywords.push(`${businessName.toLowerCase()} near me`);
  }
  
  // Add generic local keywords
  if (city) {
    keywords.push(`local sellers ${city.toLowerCase()}`);
    keywords.push(`home business ${city.toLowerCase()}`);
    keywords.push(`online store ${city.toLowerCase()}`);
    keywords.push(`microsite ${city.toLowerCase()}`);
  }
  
  // Limit to top 30 keywords to avoid keyword stuffing
  return keywords.slice(0, 30);
}

/**
 * Generate hyperlocal meta title
 * @param {Object} seller - Seller object
 * @param {String} customTitle - Custom title if provided
 * @returns {String} SEO meta title (max 60 characters)
 */
function generateHyperlocalMetaTitle(seller, customTitle = null) {
  if (customTitle) {
    // Ensure custom title is within limit
    return customTitle.length > 60 ? customTitle.substring(0, 57) + '...' : customTitle;
  }
  
  const { businessName, address, seoLocalArea } = seller;
  const city = address?.city || seoLocalArea || '';
  const business = businessName || 'Online Store';
  
  let title;
  if (city) {
    // Try full format first
    title = `${business} - Best Products in ${city} | SellLocal`;
    
    // If too long, try shorter format
    if (title.length > 60) {
      title = `${business} - Products in ${city}`;
    }
    
    // If still too long, truncate business name
    if (title.length > 60) {
      const maxBusinessLength = 60 - ` - Products in ${city}`.length;
      const truncatedBusiness = business.length > maxBusinessLength 
        ? business.substring(0, maxBusinessLength - 3) + '...'
        : business;
      title = `${truncatedBusiness} - Products in ${city}`;
    }
    
    // Final safety check - truncate if still too long
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
  } else {
    title = `${business} - Online Store`;
    if (title.length > 60) {
      const maxBusinessLength = 60 - ' - Online Store'.length;
      const truncatedBusiness = business.length > maxBusinessLength 
        ? business.substring(0, maxBusinessLength - 3) + '...'
        : business;
      title = `${truncatedBusiness} - Online Store`;
    }
  }
  
  return title;
}

/**
 * Generate hyperlocal meta description
 * @param {Object} seller - Seller object
 * @param {Array} productCategories - Array of product categories
 * @param {String} customDescription - Custom description if provided
 * @returns {String} SEO meta description
 */
function generateHyperlocalMetaDescription(seller, productCategories = [], customDescription = null) {
  if (customDescription) return customDescription;
  
  const { businessName, businessDescription, address, seoLocalArea } = seller;
  const city = address?.city || seoLocalArea || '';
  const state = address?.state || '';
  const business = businessName || 'Local Seller';
  
  // Build description with location
  let description = `Shop from ${business}`;
  
  if (city) {
    description += ` in ${city}`;
    if (state && state !== city) {
      description += `, ${state}`;
    }
  }
  
  // Add categories
  if (productCategories.length > 0) {
    const categories = productCategories.slice(0, 3).join(', ');
    description += `. Find ${categories}`;
  }
  
  description += ' at best prices. Local delivery available. Order now via WhatsApp!';
  
  // Ensure it's within 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
}

/**
 * Auto-generate SEO fields based on seller location and products
 * @param {Object} seller - Seller object
 * @param {Array} productCategories - Array of product categories
 * @returns {Object} Object with seoMetaTitle, seoMetaDescription, and seoKeywords
 */
function autoGenerateHyperlocalSEO(seller, productCategories = []) {
  return {
    seoMetaTitle: generateHyperlocalMetaTitle(seller, seller.seoMetaTitle),
    seoMetaDescription: generateHyperlocalMetaDescription(seller, productCategories, seller.seoMetaDescription),
    seoKeywords: generateHyperlocalKeywords(seller, productCategories),
    seoLocalArea: seller.seoLocalArea || seller.address?.city || seller.address?.neighborhood || ''
  };
}

/**
 * Get location string for structured data
 * @param {Object} seller - Seller object
 * @returns {Object} Location object with city, state, country
 */
function getLocationForStructuredData(seller) {
  const { address, seoLocalArea } = seller;
  
  return {
    city: address?.city || seoLocalArea || '',
    state: address?.state || '',
    country: 'IN', // India
    street: address?.street || '',
    pincode: address?.pincode || ''
  };
}

module.exports = {
  generateHyperlocalKeywords,
  generateHyperlocalMetaTitle,
  generateHyperlocalMetaDescription,
  autoGenerateHyperlocalSEO,
  getLocationForStructuredData
};
