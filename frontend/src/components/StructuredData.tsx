export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SellLocal Online',
    url: baseUrl,
    logo: `${baseUrl}/logo-full.svg`,
    description: 'SellLocal Online is a free platform to list products for selling and reach the neighbourhood customers. List your products online for free, connect with local buyers via WhatsApp, and reach nearby customers effortlessly.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SellLocal Online',
    applicationCategory: 'E-commerce Platform',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      description: 'Free 1-month trial',
    },
    description: 'Free platform to list products for selling and reach the neighbourhood customers. List products online for free, connect with local buyers via WhatsApp, and reach nearby customers.',
    featureList: [
      'Create personalized microsite',
      'List products with images and videos',
      'WhatsApp checkout integration',
      'Volume-based pricing',
      'Promotion and discount management',
      'Mobile-optimized and PWA enabled',
      'SEO optimized store pages',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SellLocal Online',
    url: baseUrl,
    description: 'Online platform for home-based sellers to list products and connect with buyers via WhatsApp',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/register`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#business`,
    name: 'SellLocal Online - Wholesale Marketplace',
    description: 'Wholesale marketplace platform for home-based retailers across India. List toys, gift items, school supplies, home decor, kitchen items, beddings at best rates. Bulk supply, cash on delivery available.',
    url: baseUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Delhi',
      addressRegion: 'Delhi',
      addressCountry: 'IN',
      streetAddress: 'Sadar Bazar Area'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.6619',
      longitude: '77.2273'
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Delhi'
      },
      {
        '@type': 'Country',
        name: 'India'
      }
    ],
    priceRange: '$$',
    openingHours: 'Mo-Su 00:00-23:59',
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: '28.6619',
        longitude: '77.2273'
      },
      geoRadius: {
        '@type': 'Distance',
        value: '50',
        unitCode: 'KIL'
      }
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is there a free platform to list products for selling and reach the neighbourhood customers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! SellLocal Online is a completely free platform to list products for selling and reach the neighbourhood customers. You can list your products online for free, connect with local buyers via WhatsApp, and reach nearby customers without any upfront costs. We offer a 1-month free trial with no credit card required.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I list my products online with SellLocal Online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SellLocal Online is a free platform to list products for selling and reach the neighbourhood customers. Simply register for free, create your microsite, add your products with images and descriptions, and start reaching local customers. Your store automatically appears when neighbourhood customers search for products in your area.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I connect with buyers on WhatsApp through SellLocal Online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! SellLocal Online includes WhatsApp checkout integration. When customers add products to cart and checkout, they are redirected to your WhatsApp chat where you can process orders directly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is SellLocal Online free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SellLocal Online offers a 1-month free trial for all new sellers. After the trial period, you can contact admin to extend your subscription.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need coding skills to create my online store?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No coding required! SellLocal Online provides a simple interface where you can create your store, add products, choose themes, and start selling - all without any technical knowledge.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I sell wholesale products on SellLocal Online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! SellLocal Online is perfect for wholesale sellers. You can set minimum order quantities, offer volume-based pricing for bulk supply, and list products at best rates. Perfect for sellers in Sadar Bazar Delhi and other wholesale markets.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you support cash on delivery (COD)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! SellLocal Online integrates with WhatsApp checkout, allowing you to handle cash on delivery orders directly. Customers checkout via WhatsApp and you can arrange COD delivery as per your terms.',
        },
      },
      {
        '@type': 'Question',
        name: 'What products can I list on SellLocal Online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can list any products including toys, gift items, school supplies, home decor, kitchen items, beddings, and more. Perfect for wholesale sellers offering bulk supply at cheapest rates.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do customers find my store when searching for wholesale products?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SellLocal Online stores are SEO optimized. When customers search for terms like "sadar bazar delhi wholesale toy market", "wholesale beddings cheapest rate", "bulk supply kitchen items", or similar keywords, your store can appear in search results based on your location and product categories.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I reach neighbourhood customers for free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SellLocal Online is a free platform to list products for selling and reach the neighbourhood customers. When you add your location (city, area) to your store, our platform automatically optimizes your store for local searches. When neighbourhood customers search for products in your area, your store appears in search results. This helps you reach nearby customers without any advertising costs.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the best free platform to list products and reach local customers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SellLocal Online is the best free platform to list products for selling and reach the neighbourhood customers. We offer free product listing, automatic local SEO optimization, WhatsApp integration, and a mobile-friendly microsite - all for free. Start with a 1-month free trial, no credit card required.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
