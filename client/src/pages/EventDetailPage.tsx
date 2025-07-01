import React from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-secondary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Event Details
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Detailed information about this event.
          </p>
        </div>

        <div className="card p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Event Details Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            This page will show detailed event information including description, 
            venue, tickets, and location on a map.
          </p>
          <div className="text-sm text-gray-500">
            Event ID: {id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage; 