import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo-full.svg" 
                alt="BloomBase" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-zinc-400 max-w-md">
              Empowering home-based sellers to bring their business online and reach customers in nearby areas. Start your digital journey today.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link href="/register" className="hover:text-cyan-400 transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  Seller Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-zinc-400">
              <li>support@bloombase.com</li>
              <li>+91 78380 55426</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-700 text-center text-zinc-500">
          <p>&copy; {new Date().getFullYear()} BloomBase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

