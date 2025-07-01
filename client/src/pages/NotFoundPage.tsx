import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary text-lg px-8 py-3 flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <Link
            to="/restaurants"
            className="btn btn-outline text-lg px-8 py-3 flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Restaurants
          </Link>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 