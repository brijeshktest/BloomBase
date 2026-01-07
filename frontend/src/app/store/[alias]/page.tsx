import { Metadata } from 'next';
import StoreClient from './StoreClient';

interface Props {
  params: Promise<{ alias: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias } = await params;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/store/${alias}?limit=1`,
      { next: { revalidate: 60 } }
    );
    
    if (res.ok) {
      const data = await res.json();
      const store = data.store;
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bloombase.com';
      const seoTitle = store.seoMetaTitle || `${store.businessName} - Shop Online`;
      const seoDescription = store.seoMetaDescription || store.businessDescription || `Shop at ${store.businessName}. Browse our products and checkout via WhatsApp.`;
      
      // Build location-based keywords if pincode/area available
      const locationKeywords = store.address?.pincode 
        ? ` near ${store.address.pincode}${store.address.city ? ` ${store.address.city}` : ''}${store.address.state ? ` ${store.address.state}` : ''}`
        : '';
      
      return {
        title: seoTitle,
        description: `${seoDescription}${locationKeywords}`,
        keywords: store.seoKeywords?.join(', ') || `${store.businessName}, online shopping, whatsapp shopping${locationKeywords}`,
        openGraph: {
          title: seoTitle,
          description: seoDescription,
          type: 'website',
          images: store.logo ? [
            {
              url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${store.logo}`,
              width: 1200,
              height: 630,
              alt: store.businessName,
            }
          ] : [],
        },
        alternates: {
          canonical: `${baseUrl}/store/${alias}`,
        },
      };
    }
  } catch (error) {
    console.error(error);
  }
  
  return {
    title: 'Store | BloomBase',
  };
}

export default async function StorePage({ params }: Props) {
  const { alias } = await params;
  return <StoreClient alias={alias} />;
}

