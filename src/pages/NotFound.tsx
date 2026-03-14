import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 text-center py-20">
      <div className="bg-brand-900/50 p-6 rounded-full mb-6 border border-brand-800">
        <FileQuestion className="w-16 h-16 text-brand-500" />
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-brand-200 mb-6">Page Not Found</h2>
      <p className="text-lg text-brand-300 max-w-md mx-auto mb-10">
        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link 
        to="/" 
        className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-brand-950 bg-accent-500 hover:bg-accent-400 rounded-xl transition-colors shadow-lg shadow-accent-500/20"
      >
        Back to Home
      </Link>
    </div>
  );
}
