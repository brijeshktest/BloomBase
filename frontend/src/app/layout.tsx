import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'BloomBase - Empowering Home-Based Sellers',
  description: 'Create your online store in minutes. BloomBase helps home-based sellers bring their business online and reach customers in nearby areas.',
  keywords: ['ecommerce', 'home business', 'online store', 'small business', 'seller platform'],
  authors: [{ name: 'BloomBase' }],
  openGraph: {
    title: 'BloomBase - Empowering Home-Based Sellers',
    description: 'Create your online store in minutes. Start selling online today!',
    type: 'website',
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
