import { Product, PriceTier } from '@/types';

/**
 * Calculate price for a given quantity based on price tiers
 */
export function getPriceForQuantity(product: Product, quantity: number): number {
  if (!product.priceTiers || product.priceTiers.length === 0) {
    return product.basePrice;
  }

  // Sort tiers by minQuantity descending (highest first)
  const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
        return tier.price;
      }
    }
  }

  return product.basePrice;
}

/**
 * Get the next better tier price and quantity needed
 */
export function getNextTierInfo(product: Product, currentQuantity: number): {
  nextTier: PriceTier | null;
  quantityNeeded: number;
  priceDifference: number;
  savings: number;
} | null {
  if (!product.priceTiers || product.priceTiers.length === 0) {
    return null;
  }

  const currentPrice = getPriceForQuantity(product, currentQuantity);
  const sortedTiers = [...product.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);

  // Find the next tier that has a better price
  for (const tier of sortedTiers) {
    if (tier.minQuantity > currentQuantity && tier.price < currentPrice) {
      const quantityNeeded = tier.minQuantity - currentQuantity;
      const priceDifference = currentPrice - tier.price;
      const savings = priceDifference * tier.minQuantity; // Total savings at that tier

      return {
        nextTier: tier,
        quantityNeeded,
        priceDifference,
        savings,
      };
    }
  }

  return null;
}

/**
 * Get all available tiers for display
 */
export function getAvailableTiers(product: Product): Array<{
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  savings?: number;
}> {
  if (!product.priceTiers || product.priceTiers.length === 0) {
    return [];
  }

  const sortedTiers = [...product.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  return sortedTiers.map((tier, index) => {
    const savings = index > 0 
      ? (getPriceForQuantity(product, tier.minQuantity - 1) - tier.price) * tier.minQuantity
      : (product.basePrice - tier.price) * tier.minQuantity;
    
    return {
      ...tier,
      savings: savings > 0 ? savings : undefined,
    };
  });
}
