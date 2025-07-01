import React from 'react';
import { Calendar, Search, MapPin } from 'lucide-react';

const EventsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-secondary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Local Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find exciting events, concerts, and activities happening near you.
          </p>
        </div>

        <div className="card p-8 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Event Discovery Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            This page will feature event search with date filters, category selection, 
            and detailed event information with ticket availability.
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Local events and activities</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage; 