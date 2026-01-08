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
  
  // Return simple metadata - don't fetch from API to avoid blocking
  // The client component will handle dynamic metadata updates
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

