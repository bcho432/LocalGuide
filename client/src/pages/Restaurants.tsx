import React, { useEffect, useState } from 'react';
import { restaurantService, Restaurant } from '../services/restaurantService';
import { Phone, ExternalLink, Tag, Star, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Restaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noLocation, setNoLocation] = useState(false);
  // Track which images failed to load
  const [imageError, setImageError] = useState<{ [id: string]: boolean }>({});
  // Track saved restaurants
  const [savedRestaurants, setSavedRestaurants] = useState<Set<string>>(new Set());
  const [savingStates, setSavingStates] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    loadSavedRestaurants();
    const cachedRestaurants = localStorage.getItem('cachedRestaurants');
    const cachedLocation = localStorage.getItem('cachedLocation');
    const savedLocation = localStorage.getItem('userLocation');
    if (cachedRestaurants && cachedLocation && savedLocation) {
      if (cachedLocation === savedLocation) {
        const cachedData = JSON.parse(cachedRestaurants);
        // Regenerate photo URLs for cached data to ensure they're fresh
        const restaurantsWithFreshPhotos = cachedData.map((restaurant: any) => ({
          ...restaurant,
          photos: restaurant.photoReferences ? restaurant.photoReferences.map((photoRef: string) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
          ) : []
        }));
        setRestaurants(restaurantsWithFreshPhotos);
        return;
      }
    }
    if (!savedLocation) {
      setNoLocation(true);
      return;
    }
    const { lat, lng } = JSON.parse(savedLocation);
    setLoading(true);
    restaurantService.getNearbyRestaurants(lat, lng)
      .then(results => {
        setRestaurants(results);
        // Store photo references separately for cache regeneration
        const restaurantsForCache = results.map((restaurant: any) => ({
          ...restaurant,
          photoReferences: restaurant.photos ? restaurant.photos.map((photoUrl: string) => {
            const photoRefMatch = photoUrl.match(/photoreference=([^&]+)/);
            return photoRefMatch ? photoRefMatch[1] : null;
          }).filter(Boolean) : [],
          photos: [] // Don't cache the actual URLs
        }));
        // Update cache
        localStorage.setItem('cachedRestaurants', JSON.stringify(restaurantsForCache));
        localStorage.setItem('cachedLocation', JSON.stringify({ lat, lng }));
      })
      .catch(() => setError('Failed to fetch restaurants.'))
      .finally(() => setLoading(false));
  }, []);

  const loadSavedRestaurants = async () => {
    try {
      const favorites = await restaurantService.getMyFavorites();
      const savedIds = new Set(favorites.map((fav: any) => fav.place_id));
      setSavedRestaurants(savedIds);
    } catch (error) {
      console.error('Failed to load saved restaurants:', error);
    }
  };

  const handleSaveRestaurant = async (restaurant: Restaurant) => {
    const isSaved = savedRestaurants.has(restaurant.id);
    setSavingStates(prev => ({ ...prev, [restaurant.id]: true }));
    
    try {
      if (isSaved) {
        await restaurantService.removeFromFavorites(restaurant.id);
        setSavedRestaurants(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurant.id);
          return newSet;
        });
      } else {
        await restaurantService.addToFavorites(restaurant.id, restaurant.name);
        setSavedRestaurants(prev => new Set(prev).add(restaurant.id));
      }
    } catch (error) {
      console.error('Failed to save/unsave restaurant:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [restaurant.id]: false }));
    }
  };

  if (noLocation) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Restaurants</h1>
        <p className="text-gray-600">Please use "Get My Location" on the homepage first.</p>
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Restaurants Near You</h1>
      {loading && (
        <LoadingSpinner message="Loading restaurants..." />
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="max-w-4xl mx-auto mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map(r => (
          <div key={r.id || r.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <Link to={`/restaurants/${r.id}`} className="flex-1 block">
              {/* Restaurant Photos or fallback */}
              {r.photos && r.photos.length > 0 && !imageError[r.id] ? (
                <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-100">
                  <img 
                    src={r.photos[0]} 
                    alt={r.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImageError(prev => ({ ...prev, [r.id]: true }))}
                  />
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-gray-200">
                  <span className="text-6xl font-bold text-gray-400">:(</span>
                  <span className="text-sm text-gray-500 mt-2">No image to display</span>
                </div>
              )}
              <div className="p-6">
                {/* Restaurant Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{r.name}</h3>
                {/* Address */}
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{r.address || r.vicinity || ''}</span>
                </div>
                {/* Rating */}
                {r.rating && (
                  <div className="flex items-center mb-3">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {r.rating} {r.totalRatings && `(${r.totalRatings} reviews)`}
                    </span>
                  </div>
                )}
                {/* Categories */}
                {r.categories && r.categories.length > 0 && (
                  <div className="flex items-center mb-3">
                    <Tag className="w-4 h-4 text-gray-400 mr-2" />
                    <div className="flex flex-wrap gap-1">
                      {r.categories.slice(0, 3).map((category, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Distance */}
                {r.distance && (
                  <div className="text-sm text-gray-500 mb-3">
                    {r.distance}m away
                  </div>
                )}
              </div>
            </Link>
            {/* Action Buttons (not inside Link) */}
            <div className="flex gap-2 p-4 pt-0 mt-auto">
              {r.phone && (
                <a 
                  href={`tel:${r.phone}`}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </a>
              )}
              {r.yelpUrl && (
                <a 
                  href={r.yelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Yelp
                </a>
              )}
              <button
                onClick={() => handleSaveRestaurant(r)}
                className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                disabled={savingStates[r.id]}
              >
                <Heart className={`w-4 h-4 mr-1 ${savedRestaurants.has(r.id) ? 'fill-red-500' : ''}`} />
                {savingStates[r.id] ? 'Saving...' : (savedRestaurants.has(r.id) ? 'Unsave' : 'Save')}
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && restaurants.length === 0 && !error && (
        <p className="text-gray-600">No restaurants found near your location.</p>
      )}
    </div>
  );
};

export default Restaurants; 