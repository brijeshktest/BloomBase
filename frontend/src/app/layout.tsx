import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import StructuredData from '@/components/StructuredData';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com'),
  title: {
    default: 'Free Platform to List Products & Reach Neighbourhood Customers - SellLocal Online',
    template: '%s | SellLocal Online'
  },
  description: 'Free platform to list products for selling and reach neighbourhood customers. SellLocal Online helps home-based retailers list products online for free and connect with local buyers via WhatsApp. Reach nearby customers, boost local sales - start selling today!',
  keywords: [
    // Primary keywords - Target search query
    'platform to list products for selling and reach the neighbourhood customers for free',
    'free platform to list products',
    'list products online reach neighbourhood customers',
    'platform to list products for selling',
    'reach neighbourhood customers for free',
    'free platform to reach local customers',
    'list products online free',
    'online platform to list products',
    'list products online connect buyers whatsapp',
    'free product listing platform',
    'reach local customers online',
    'neighbourhood customer platform',
    'free online selling platform',
    'wholesale toy market',
    'wholesale',
    'cheapest rate',
    'best rates',
    'bulk supply',
    'cash on delivery',
    'COD',
    // Location-based keywords
    'sadar bazar delhi',
    'wholesale market delhi',
    'sadar bazar',
    'delhi wholesale',
    // Product category keywords
    'toy',
    'toys',
    'gift items',
    'school supplies',
    'home decor',
    'home decoration',
    'kitchen items',
    'beddings',
    'bedding',
    // Platform keywords
    'online store platform',
    'ecommerce platform',
    'home business online',
    'sell products online whatsapp',
    'small business ecommerce',
    'local seller platform',
    'whatsapp ecommerce',
    'create online store free',
    'microsite builder',
    'home-based seller platform',
    'online marketplace',
    'product listing platform',
    'whatsapp shopping',
    'local business online',
    'sell online india',
    'home sellers platform',
    'online selling platform',
    'ecommerce for small business',
    'wholesale marketplace',
    'bulk buying platform',
    'wholesale supplier',
    'wholesale dealer',
    'wholesale distributor'
  ],
  authors: [{ name: 'SellLocal Online', url: 'https://selllocalonline.com' }],
  creator: 'SellLocal Online',
  publisher: 'SellLocal Online',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'SellLocal Online',
    title: 'Free Platform to List Products & Reach Neighbourhood Customers - SellLocal Online',
    description: 'Free platform to list products for selling and reach neighbourhood customers. List your products online for free and connect with local buyers via WhatsApp. Perfect for home-based retailers to reach nearby customers.',
    images: [
      {
        url: '/logo-full.svg',
        width: 1200,
        height: 630,
        alt: 'SellLocal Online - Online Platform for Home-Based Sellers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SellLocal Online - Online Platform to List Products & Connect with Buyers',
    description: 'Create your free online store. List products and connect with buyers via WhatsApp.',
    images: ['/logo-full.svg'],
    creator: '@SellLocalOnline',
  },
  alternates: {
    canonical: '/',
  },
  category: 'E-commerce Platform',
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
