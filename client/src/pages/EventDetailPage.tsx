import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Car } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedEvent = localStorage.getItem(`cachedEvent_${id}`);
      if (cachedEvent) {
        setEvent(JSON.parse(cachedEvent));
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/events/ticketmaster/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setEvent(data.event);
          // Cache the event details
          localStorage.setItem(`cachedEvent_${id}`, JSON.stringify(data.event));
        } else {
          setError('Failed to load event details.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading event details..." />;
  if (error) return <div className="py-16 text-center text-red-600">{error}</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          {event.image && (
            <img src={event.image} alt={event.name} className="w-full max-w-md h-64 object-cover rounded mb-6" />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
          <div className="flex items-center text-gray-600 mb-3">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">
              {formatEventDateTime(event.date, event.time)}
            </span>
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-5 h-5 mr-2" />
            <span className="text-lg">{event.venue}{event.address ? `, ${event.address}` : ''}{event.city ? `, ${event.city}` : ''}</span>
          </div>
          {travelTime && (
            <div className="flex items-center text-gray-600 mb-3">
              <Car className="w-5 h-5 mr-2" />
              <span className="text-lg">Travel time: {travelTime}</span>
            </div>
          )}
          {event.description && (
            <div className="mt-4 text-gray-700 text-base text-left w-full">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p>{event.description}</p>
            </div>
          )}
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            View Event on Ticketmaster
          </a>
        </div>
      </div>
    </div>
  );
};

function formatEventDateTime(date?: string, time?: string) {
  if (!date && !time) return '';
  if (date && time) {
    const dt = new Date(`${date}T${time}`);
    return dt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (date) {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return time || '';
}

export default EventDetailPage; 