import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, Calendar, Building, Trash2 } from 'lucide-react';
import { favoritesService, SavedItem } from '../services/favoritesService';
import LoadingSpinner from '../components/LoadingSpinner';

const Saved: React.FC = () => {
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'event' | 'hotel'>('all');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const allFavorites = await favoritesService.getAllFavorites();
      setFavorites(allFavorites);
    } catch (err) {
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (placeId: string, placeType: 'restaurant' | 'event' | 'hotel') => {
    try {
      await favoritesService.removeFavorite(placeId, placeType);
      // Remove from local state
      setFavorites(prev => prev.filter(fav => !(fav.place_id === placeId && fav.place_type === placeType)));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const getFilteredFavorites = () => {
    if (activeTab === 'all') return favorites;
    return favorites.filter(fav => fav.place_type === activeTab);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Building className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'hotel':
        return <Building className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const getLinkForType = (type: string, placeId: string) => {
    switch (type) {
      case 'restaurant':
        return `/restaurants/${placeId}`;
      case 'event':
        return `/events/${placeId}`;
      case 'hotel':
        return `/hotels/${placeId}`;
      default:
        return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurant';
      case 'event':
        return 'Event';
      case 'hotel':
        return 'Hotel';
      default:
        return type;
    }
  };

  // Helper to get hotel image
  const getHotelImage = (details: any) => {
    if (details?.photos && details.photos.length > 0) {
      const photo = details.photos[0];
      if (typeof photo === 'string') {
        // Already a URL
        return photo;
      }
      if (photo.photo_reference) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      }
    }
    return null;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your saved items..." />;
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Saved Items</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const filteredFavorites = getFilteredFavorites();

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Your Saved Items</h1>
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: favorites.length },
            { key: 'restaurant', label: 'Restaurants', count: favorites.filter(f => f.place_type === 'restaurant').length },
            { key: 'event', label: 'Events', count: favorites.filter(f => f.place_type === 'event').length },
            { key: 'hotel', label: 'Hotels', count: favorites.filter(f => f.place_type === 'hotel').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {activeTab === 'all' ? 'No saved items yet' : `No saved ${activeTab}s yet`}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'all' 
              ? 'Start exploring restaurants, events, and hotels to save your favorites!'
              : `Start exploring ${activeTab}s to save your favorites!`
            }
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFavorites.map((favorite) => (
            <div key={`${favorite.place_type}-${favorite.place_id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link to={getLinkForType(favorite.place_type, favorite.place_id)} className="block">
                {/* Image or placeholder */}
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {favorite.place_type === 'hotel' ? (
                    typeof getHotelImage(favorite.details) === 'string' ? (
                      <img
                        src={getHotelImage(favorite.details) as string}
                        alt={favorite.place_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">{getIconForType(favorite.place_type)}</div>
                        <span className="text-sm text-gray-500">No image</span>
                      </div>
                    )
                  ) : (
                    favorite.details?.photos && favorite.details.photos.length > 0 ? (
                      <img 
                        src={favorite.details.photos[0]} 
                        alt={favorite.place_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">{getIconForType(favorite.place_type)}</div>
                        <span className="text-sm text-gray-500">No image</span>
                      </div>
                    )
                  )}
                </div>
                
                <div className="p-6">
                  {/* Type badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {getTypeLabel(favorite.place_type)}
                    </span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{favorite.place_name}</h3>
                  
                  {/* Address */}
                  {favorite.details?.address && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{favorite.details.address}</span>
                    </div>
                  )}
                  
                  {/* Rating */}
                  {favorite.details?.rating && (
                    <div className="flex items-center mb-3">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {favorite.details.rating}
                        {favorite.details.totalRatings && ` (${favorite.details.totalRatings} reviews)`}
                      </span>
                    </div>
                  )}
                  
                  {/* Distance */}
                  {favorite.details?.distance && (
                    <div className="text-sm text-gray-500">
                      {favorite.details.distance}m away
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Remove button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleRemoveFavorite(favorite.place_id, favorite.place_type)}
                  className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved; 