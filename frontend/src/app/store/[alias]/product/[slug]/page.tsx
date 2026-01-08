import { Metadata } from 'next';
import ProductClient from './ProductClient';

interface Props {
  params: Promise<{ alias: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias, slug } = await params;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/store/${alias}/${slug}`,
      { next: { revalidate: 60 } }
    );
    
    if (res.ok) {
      const data = await res.json();
      const product = data.product;
      const store = data.store;
      
      return {
        title: `${product.metaTitle || product.name} | ${store.businessName}`,
        description: product.metaDescription || product.description?.substring(0, 160),
        openGraph: {
          title: product.name,
          description: product.description?.substring(0, 160),
          images: product.images?.[0] ? [
            {
              url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`,
            }
          ] : [],
        },
      };
    }
  } catch (error) {
    console.error(error);
  }
  
  return {
    title: 'Product | SellLocal Online',
  };
}

export default async function ProductPage({ params }: Props) {
  const { alias, slug } = await params;
  return <ProductClient alias={alias} slug={slug} />;
}

