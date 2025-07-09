import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Bed, Car, Phone, ExternalLink, Clock, Heart } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { hotelService } from '../services/hotelService';

interface HotelDetail {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  url?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }>;
  travel_time?: string;
}

const HotelDetailPage: React.FC = () => {
  const { place_id } = useParams<{ place_id: string }>();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedHotel = localStorage.getItem(`cachedHotel_${place_id}`);
      if (cachedHotel) {
        setHotel(JSON.parse(cachedHotel));
        setLoading(false);
        return;
      }
      
      try {
        // Get user location for travel time
        const userLocation = localStorage.getItem('userLocation');
        let url = `/api/hotels/${place_id}`;
        if (userLocation) {
          const { lat, lng } = JSON.parse(userLocation);
          url += `?userLocation=${lat},${lng}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setHotel(data.hotel);
          // Cache the hotel details
          localStorage.setItem(`cachedHotel_${place_id}`, JSON.stringify(data.hotel));
        } else {
          setError('Failed to load hotel details.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [place_id]);

  useEffect(() => {
    async function checkSaved() {
      if (!hotel) return;
      try {
        const favorites = await hotelService.getMyFavorites();
        setSaved(favorites.some((fav: any) => fav.place_id === hotel.place_id));
      } catch (e) {
        setSaved(false);
      }
    }
    checkSaved();
  }, [hotel]);

  const handleSave = async () => {
    if (!hotel) return;
    setSaving(true);
    try {
      if (saved) {
        await hotelService.removeFromFavorites(hotel.place_id);
        setSaved(false);
      } else {
        await hotelService.addToFavorites(hotel.place_id, hotel.name);
        setSaved(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading hotel details..." />;
  if (error) return <div className="py-16 text-center text-red-600">{error}</div>;
  if (!hotel) return null;

  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A';
    return '$'.repeat(level);
  };

  const getHotelImage = () => {
    if (hotel.photos && hotel.photos.length > 0 && !imageError) {
      const photo = hotel.photos[0];
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
    }
    return null;
  };

  return (
    <div className="py-16 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Hotel Image */}
        {getHotelImage() ? (
          <div className="h-64 md:h-96 overflow-hidden">
            <img
              src={getHotelImage()!}
              alt={hotel.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="h-64 md:h-96 flex flex-col items-center justify-center bg-gray-200">
            <Bed className="w-16 h-16 text-gray-400 mb-4" />
            <span className="text-gray-500">No image available</span>
          </div>
        )}

        {/* Main content with extra horizontal padding */}
        <div className="px-8 py-6">
          {/* Hotel Name and Save Button Row */}
          <div className="flex items-center justify-between mb-6 mt-6">
            <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${saved ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              <Heart className={`w-5 h-5 mr-2 ${saved ? 'fill-red-500' : ''}`} />
              {saving ? 'Saving...' : saved ? 'Unsave' : 'Save'}
            </button>
          </div>

          {/* Address */}
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-5 h-5 mr-2" />
            <span>{hotel.formatted_address}</span>
          </div>

          {/* Rating and Reviews */}
          {hotel.rating && (
            <div className="flex items-center mb-3">
              <Star className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="text-lg font-semibold text-gray-900 mr-2">
                {hotel.rating}
              </span>
              {hotel.user_ratings_total && (
                <span className="text-gray-600">
                  ({hotel.user_ratings_total} reviews)
                </span>
              )}
            </div>
          )}

          {/* Price Level */}
          {hotel.price_level && (
            <div className="mb-3">
              <span className="text-lg font-medium text-green-600">
                Price Level: {getPriceLevel(hotel.price_level)}
              </span>
            </div>
          )}

          {/* Travel Time */}
          {hotel.travel_time && (
            <div className="flex items-center text-gray-600 mb-3">
              <Car className="w-5 h-5 mr-2" />
              <span>Travel time: {hotel.travel_time}</span>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              
              {hotel.formatted_phone_number && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{hotel.formatted_phone_number}</span>
                </div>
              )}

              {hotel.website && (
                <div className="flex items-center text-gray-600 mb-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <a 
                    href={hotel.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              {hotel.url && (
                <div className="flex items-center text-gray-600 mb-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <a 
                    href={hotel.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            {hotel.opening_hours && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className={hotel.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}>
                    {hotel.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                {hotel.opening_hours.weekday_text && (
                  <div className="text-sm text-gray-600">
                    {hotel.opening_hours.weekday_text.map((day, index) => (
                      <div key={index} className="mb-1">{day}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reviews */}
          {hotel.reviews && hotel.reviews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Reviews</h3>
              <div className="space-y-4">
                {hotel.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{review.author_name}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.text}</p>
                    <span className="text-xs text-gray-500">{review.relative_time_description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {hotel.website && (
              <a
                href={hotel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Visit Website
              </a>
            )}
            {hotel.url && (
              <a
                href={hotel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View on Google Maps
              </a>
            )}
            {hotel.formatted_phone_number && (
              <a
                href={`tel:${hotel.formatted_phone_number}`}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Hotel
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage; 