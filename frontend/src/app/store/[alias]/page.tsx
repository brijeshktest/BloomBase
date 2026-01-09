import { Metadata } from 'next';
import StoreClient from './StoreClient';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ alias: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Get alias safely
  let alias = '';
  try {
    const resolvedParams = await params;
    alias = resolvedParams?.alias || '';
  } catch (error) {
    console.error('Error getting alias for metadata:', error);
  }
  
  // Fetch store data for hyperlocal SEO
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/products/store/${alias}?limit=1`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (res.ok) {
      const data = await res.json();
      const store = data.store;
      const categories = data.categories || [];
      
      // Build location string
      const locationParts = [];
      if (store.address?.city) locationParts.push(store.address.city);
      if (store.address?.state && store.address.state !== store.address?.city) {
        locationParts.push(store.address.state);
      }
      const location = locationParts.length > 0 ? ` in ${locationParts.join(', ')}` : '';
      
      // Generate title
      const title = store.seoMetaTitle || 
        `${store.businessName || 'Store'}${location} | SellLocal Online`;
      
      // Generate description
      const description = store.seoMetaDescription || 
        `Shop from ${store.businessName || 'local seller'}${location}. ` +
        (categories.length > 0 ? `Find ${categories.slice(0, 3).join(', ')} ` : '') +
        `at best prices. Local delivery available. Order now via WhatsApp!`;
      
      // Generate keywords
      const keywords = store.seoKeywords || [];
      if (store.address?.city) {
        keywords.push(`${store.businessName || 'store'} ${store.address.city}`);
        keywords.push(`local sellers ${store.address.city}`);
      }
      
      return {
        title,
        description: description.substring(0, 160),
        keywords: keywords.join(', '),
        openGraph: {
          title,
          description: description.substring(0, 160),
          type: 'website',
          locale: 'en_IN',
          siteName: 'SellLocal Online',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description: description.substring(0, 160),
        },
      };
    }
  } catch (error) {
    console.error('Error fetching store metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: `Store | SellLocal Online`,
    description: 'Store page on SellLocal Online',
  };
}

export default async function StorePage({ params }: Props) {
  // Always render - never throw or call notFound()
  let alias = '';
  try {
    const resolvedParams = await params;
    alias = resolvedParams?.alias || '';
  } catch (error) {
    console.error('Error getting params:', error);
    // Continue with empty alias - StoreClient will handle it
  }
  
  // Always render the client component - let it handle 404s
  return <StoreClient alias={alias} />;
}

