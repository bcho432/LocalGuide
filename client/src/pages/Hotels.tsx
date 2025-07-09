import React, { useEffect, useState } from 'react';
import { MapPin, Star, Bed, Phone, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { hotelService } from '../services/hotelService';

interface Hotel {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  phone?: string;
  website?: string;
  google_url?: string;
}

const Hotels: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noLocation, setNoLocation] = useState(false);
  const [imageError, setImageError] = useState<{ [id: string]: boolean }>({});
  // Track saved hotels
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set());
  const [savingStates, setSavingStates] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    loadSavedHotels();
  }, []);

  const loadSavedHotels = async () => {
    try {
      const favorites = await hotelService.getMyFavorites();
      const savedIds = new Set(favorites.map((fav: any) => fav.place_id));
      setSavedHotels(savedIds);
    } catch (error) {
      console.error('Failed to load saved hotels:', error);
    }
  };

  const handleSaveHotel = async (hotel: Hotel) => {
    const isSaved = savedHotels.has(hotel.place_id);
    setSavingStates(prev => ({ ...prev, [hotel.place_id]: true }));
    
    try {
      if (isSaved) {
        await hotelService.removeFromFavorites(hotel.place_id);
        setSavedHotels(prev => {
          const newSet = new Set(prev);
          newSet.delete(hotel.place_id);
          return newSet;
        });
      } else {
        await hotelService.addToFavorites(hotel.place_id, hotel.name);
        setSavedHotels(prev => new Set(prev).add(hotel.place_id));
      }
    } catch (error) {
      console.error('Failed to save/unsave hotel:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [hotel.place_id]: false }));
    }
  };

  useEffect(() => {
    const cachedHotels = localStorage.getItem('cachedHotels');
    const cachedLocation = localStorage.getItem('cachedHotelLocation');
    const savedLocation = localStorage.getItem('userLocation');
    
    if (cachedHotels && cachedLocation && savedLocation) {
      if (cachedLocation === savedLocation) {
        setHotels(JSON.parse(cachedHotels));
        return;
      }
    }
    
    if (!savedLocation) {
      setNoLocation(true);
      return;
    }
    const { lat, lng } = JSON.parse(savedLocation);
    setLoading(true);
    fetch(`/api/hotels/nearby?lat=${lat}&lng=${lng}&radius=10000`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHotels(data.hotels);
          // Update cache
          localStorage.setItem('cachedHotels', JSON.stringify(data.hotels));
          localStorage.setItem('cachedHotelLocation', JSON.stringify({ lat, lng }));
        } else {
          setError('Failed to fetch hotels.');
        }
      })
      .catch(() => setError('Failed to fetch hotels.'))
      .finally(() => setLoading(false));
  }, []);

  if (noLocation) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Hotels</h1>
        <p className="text-gray-600">Please use "Get My Location" on the homepage first.</p>
      </div>
    );
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A';
    return '$'.repeat(level);
  };

  const getHotelImage = (hotel: Hotel) => {
    if (hotel.photos && hotel.photos.length > 0 && !imageError[hotel.place_id]) {
      const photo = hotel.photos[0];
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
    }
    return null;
  };

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Hotels Near You</h1>
      {loading && (
        <LoadingSpinner message="Loading hotels..." />
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="max-w-4xl mx-auto mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map(hotel => (
          <div key={hotel.place_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <Link to={`/hotels/${hotel.place_id}`} className="flex-1 block">
              {/* Hotel Image or fallback */}
              {getHotelImage(hotel) ? (
                <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-100">
                  <img
                    src={getHotelImage(hotel)!}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImageError(prev => ({ ...prev, [hotel.place_id]: true }))}
                  />
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-gray-200">
                  <Bed className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">No image available</span>
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                {/* Hotel Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{hotel.name}</h3>
                {/* Address */}
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{hotel.vicinity}</span>
                </div>
                {/* Rating */}
                {hotel.rating && (
                  <div className="flex items-center mb-3">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-700">
                      {hotel.rating} {hotel.user_ratings_total && `(${hotel.user_ratings_total} reviews)`}
                    </span>
                  </div>
                )}
                {/* Price Level */}
                {hotel.price_level && (
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-green-600">
                      {getPriceLevel(hotel.price_level)}
                    </span>
                  </div>
                )}
                {/* Phone */}
                {hotel.phone && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">{hotel.phone}</span>
                  </div>
                )}
              </div>
            </Link>
            <div className="mt-auto">
              {/* Action Buttons */}
              <div className="flex gap-2 p-4">
                {hotel.website && (
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    onClick={ev => ev.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Website
                  </a>
                )}
                {hotel.google_url && (
                  <a
                    href={hotel.google_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    onClick={ev => ev.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Google
                  </a>
                )}
                <button
                  onClick={() => handleSaveHotel(hotel)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-white text-sm rounded-md transition-colors ${savedHotels.has(hotel.place_id) ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`}
                  disabled={savingStates[hotel.place_id]}
                >
                  <Heart className={`w-4 h-4 mr-1 ${savedHotels.has(hotel.place_id) ? 'fill-red-500' : ''}`} />
                  {savingStates[hotel.place_id] ? 'Saving...' : savedHotels.has(hotel.place_id) ? 'Unsave' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && hotels.length === 0 && !error && (
        <p className="text-gray-600">No hotels found near your location.</p>
      )}
    </div>
  );
};

export default Hotels; 