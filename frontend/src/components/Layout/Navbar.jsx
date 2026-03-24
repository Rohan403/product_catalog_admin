import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="bg-primary-700 text-white h-14 flex items-center px-6 shadow-md z-10">
      <Link to="/products" className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <span className="bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center text-base">🛍️</span>
        Product Catalog Admin
      </Link>
      <nav className="ml-auto flex gap-4 text-sm font-medium">
        <Link to="/search" className="hover:text-primary-100 transition-colors">
          Search
        </Link>
        <a
          href="/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary-100 transition-colors"
        >
          API Docs
        </a>
      </nav>
    </header>
  );
}
