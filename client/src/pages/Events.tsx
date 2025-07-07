import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Tag, ExternalLink } from 'lucide-react';

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  image?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  category?: string;
}

// Popular Ticketmaster segment IDs and names
const EVENT_TYPES = [
  { label: 'All', value: '' },
  { label: 'Music', value: 'KZFzniwnSyZfZ7v7nJ' },
  { label: 'Sports', value: 'KZFzniwnSyZfZ7v7nE' },
  { label: 'Arts & Theater', value: 'KZFzniwnSyZfZ7v7na' },
  { label: 'Film', value: 'KZFzniwnSyZfZ7v7nn' },
  { label: 'Miscellaneous', value: 'KZFzniwnSyZfZ7v7n1' },
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noLocation, setNoLocation] = useState(false);
  const [imageError, setImageError] = useState<{ [id: string]: boolean }>({});
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (!savedLocation) {
      setNoLocation(true);
      return;
    }
    const { lat, lng } = JSON.parse(savedLocation);
    setLoading(true);
    // Build query params
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: '10',
    });
    if (type) params.append('segmentId', type);
    if (startDate) params.append('startDateTime', new Date(startDate).toISOString().slice(0, 19) + 'Z');
    if (endDate) params.append('endDateTime', new Date(endDate).toISOString().slice(0, 19) + 'Z');
    fetch(`/api/events/ticketmaster/nearby?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.events);
        } else {
          setError('Failed to fetch events.');
        }
      })
      .catch(() => setError('Failed to fetch events.'))
      .finally(() => setLoading(false));
  }, [type, startDate, endDate]);

  if (noLocation) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Events</h1>
        <p className="text-gray-600">Please use "Get My Location" on the homepage first.</p>
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Events Near You</h1>
      {/* Filters */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
        <div>
          <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select
            id="event-type"
            value={type}
            onChange={e => setType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EVENT_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {loading && (
        <div className="flex flex-col items-center justify-center my-12 animate-fade-in">
          <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-blue-600 text-lg font-semibold animate-pulse">Loading events...</span>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="max-w-4xl mx-auto mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(e => (
          <div key={e.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            {/* Event Image or fallback */}
            {e.image && !imageError[e.id] ? (
              <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-100">
                <img
                  src={e.image}
                  alt={e.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImageError(prev => ({ ...prev, [e.id]: true }))}
                />
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center bg-gray-200">
                <span className="text-6xl font-bold text-gray-400">:(</span>
                <span className="text-sm text-gray-500 mt-2">No image to display</span>
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              {/* Event Name */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{e.name}</h3>
              {/* Date & Time */}
              {(e.date || e.time) && (
                <div className="flex items-center text-gray-600 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatEventDateTime(e.date, e.time)}
                  </span>
                </div>
              )}
              {/* Venue & Address */}
              {(e.venue || e.address) && (
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{e.venue}{e.address ? `, ${e.address}` : ''}{e.city ? `, ${e.city}` : ''}</span>
                </div>
              )}
              {/* Category */}
              {e.category && (
                <div className="flex items-center mb-3">
                  <Tag className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{e.category}</span>
                </div>
              )}
              {/* Country */}
              {e.country && (
                <div className="text-xs text-gray-400 mb-2">{e.country}</div>
              )}
              <div className="mt-auto">
                {/* Action Button */}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors mt-4"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Event
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && events.length === 0 && !error && (
        <p className="text-gray-600">No events found near your location.</p>
      )}
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

export default Events; 