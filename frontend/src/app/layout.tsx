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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bloombase.com'),
  title: {
    default: 'BloomBase - Online Platform to List Products & Connect with Buyers on WhatsApp',
    template: '%s | BloomBase'
  },
  description: 'BloomBase is the best online platform for home-based sellers to list their products and connect with buyers via WhatsApp. Create your free online store in minutes, no coding required. Start selling to customers in your local area today with WhatsApp checkout.',
  keywords: [
    'online platform to list products',
    'list products online connect buyers whatsapp',
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
    'ecommerce for small business'
  ],
  authors: [{ name: 'BloomBase', url: 'https://bloombase.com' }],
  creator: 'BloomBase',
  publisher: 'BloomBase',
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
    siteName: 'BloomBase',
    title: 'BloomBase - Online Platform to List Products & Connect with Buyers on WhatsApp',
    description: 'Create your free online store in minutes. List your products and connect with buyers directly via WhatsApp. Perfect for home-based sellers and small businesses.',
    images: [
      {
        url: '/logo-full.svg',
        width: 1200,
        height: 630,
        alt: 'BloomBase - Online Platform for Home-Based Sellers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BloomBase - Online Platform to List Products & Connect with Buyers',
    description: 'Create your free online store. List products and connect with buyers via WhatsApp.',
    images: ['/logo-full.svg'],
    creator: '@BloomBase',
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
