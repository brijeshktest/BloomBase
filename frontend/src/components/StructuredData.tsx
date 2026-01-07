export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bloombase.com';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BloomBase',
    url: baseUrl,
    logo: `${baseUrl}/logo-full.svg`,
    description: 'BloomBase is an online platform that empowers home-based sellers to list their products and connect with buyers via WhatsApp. Create your free online store in minutes.',
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
    name: 'BloomBase',
    applicationCategory: 'E-commerce Platform',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      description: 'Free 1-month trial',
    },
    description: 'Online platform to list products and connect with buyers on WhatsApp. Create your microsite, add products, and start selling with WhatsApp checkout.',
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
    name: 'BloomBase',
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I list my products online with BloomBase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BloomBase is an online platform that allows you to create a free microsite, list your products with images and descriptions, and connect with buyers directly via WhatsApp. Simply register, add your products, and share your store link with customers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I connect with buyers on WhatsApp through BloomBase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! BloomBase includes WhatsApp checkout integration. When customers add products to cart and checkout, they are redirected to your WhatsApp chat where you can process orders directly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is BloomBase free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BloomBase offers a 1-month free trial for all new sellers. After the trial period, you can contact admin to extend your subscription.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need coding skills to create my online store?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No coding required! BloomBase provides a simple interface where you can create your store, add products, choose themes, and start selling - all without any technical knowledge.',
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
    </>
  );
}
