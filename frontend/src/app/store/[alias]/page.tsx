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
      
      return {
        title: `${store.businessName} | Shop Online`,
        description: store.businessDescription || `Shop at ${store.businessName}`,
        openGraph: {
          title: store.businessName,
          description: store.businessDescription || `Shop at ${store.businessName}`,
          type: 'website',
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

