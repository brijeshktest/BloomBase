'use client';

import { Store } from '@/types';

interface StoreStructuredDataProps {
  store: Store;
  categories?: string[];
}

export default function StoreStructuredData({ store, categories = [] }: StoreStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com';
  const storeUrl = `${baseUrl}/store/${store.alias || ''}`;
  
  // Build location data
  const address = store.address || {};
  const city = address.city || store.seoLocalArea || '';
  const state = address.state || '';
  const country = 'IN';
  
  // Check if Area Specialist is enabled and address is provided
  const isAreaSpecialist = store.areaSpecialist === true;
  const hasAddress = !!(address.street || address.city || address.state || address.pincode);
  const shouldInjectEnhancedSchema = isAreaSpecialist && hasAddress;
  
  // Build description
  const description = store.seoMetaDescription || 
    store.businessDescription || 
    `Shop from ${store.businessName || 'local seller'}${city ? ` in ${city}` : ''}. ` +
    (categories.length > 0 ? `Find ${categories.slice(0, 3).join(', ')} ` : '') +
    `at best prices. Local delivery available.`;
  
  // Build comprehensive PostalAddress schema (only when Area Specialist is enabled)
  const postalAddressSchema = shouldInjectEnhancedSchema && (address.street || address.city || address.state || address.pincode) ? {
    '@type': 'PostalAddress',
    '@id': `${storeUrl}#address`,
    streetAddress: address.street || undefined,
    addressLocality: address.city || city || undefined,
    addressRegion: address.state || state || undefined,
    postalCode: address.pincode || undefined,
    addressCountry: {
      '@type': 'Country',
      name: 'India',
      '@id': 'https://www.wikidata.org/wiki/Q668'
    }
  } : undefined;
  
  // Build LocalBusiness schema with enhanced fields for Area Specialists
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${storeUrl}#business`,
    name: store.businessName || 'Local Seller',
    description: description.substring(0, 500),
    url: storeUrl,
    image: store.logo ? (
      store.logo.startsWith('http://') || store.logo.startsWith('https://') || store.logo.startsWith('data:image/')
        ? store.logo
        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${store.logo}`
    ) : undefined,
    telephone: store.phone || undefined,
    // Use enhanced PostalAddress schema when Area Specialist is enabled
    address: shouldInjectEnhancedSchema ? postalAddressSchema : (city || state ? {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: country,
      streetAddress: address.street || undefined,
      postalCode: address.pincode || undefined
    } : undefined),
    // Enhanced areaServed for Area Specialists
    areaServed: shouldInjectEnhancedSchema && city ? [
      {
        '@type': 'City',
        name: city,
        ...(address.pincode ? { postalCode: address.pincode } : {})
      },
      ...(state && state !== city ? [{
        '@type': 'State',
        name: state
      }] : []),
      {
        '@type': 'Country',
        name: 'India'
      }
    ] : (city ? [
      {
        '@type': 'City',
        name: city
      },
      ...(state && state !== city ? [{
        '@type': 'State',
        name: state
      }] : [])
    ] : undefined),
    priceRange: '$$',
    openingHours: 'Mo-Su 00:00-23:59',
    // Enhanced makesOffer for Area Specialists
    ...(categories.length > 0 && {
      makesOffer: categories.map(category => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          category: category,
          ...(shouldInjectEnhancedSchema && city ? {
            availableAtOrFrom: {
              '@type': 'Place',
              address: postalAddressSchema
            }
          } : {})
        },
        ...(shouldInjectEnhancedSchema ? {
          areaServed: {
            '@type': 'City',
            name: city
          }
        } : {})
      }))
    }),
  };
  
  // Remove undefined fields
  const cleanSchema = JSON.parse(JSON.stringify(localBusinessSchema, (key, value) => {
    return value === undefined ? undefined : value;
  }));
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
