import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - Start Selling Online with SellLocal Online',
  description: 'Create your free online store today. Register on SellLocal Online to list your products and connect with buyers via WhatsApp. Start your 1-month free trial now.',
  keywords: ['register online store', 'create online store', 'seller registration', 'list products online', 'whatsapp ecommerce'],
  openGraph: {
    title: 'Register - Start Selling Online with SellLocal Online',
    description: 'Create your free online store and start listing products today.',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
