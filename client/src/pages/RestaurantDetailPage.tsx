import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Star, Car, Heart } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import LoadingSpinner from '../components/LoadingSpinner';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Function to check restaurant status and timing
const getRestaurantStatus = (openingHoursText: string[]): { isOpen: boolean; closesSoon?: boolean; opensSoon?: boolean; nextOpenTime?: string; nextCloseTime?: string } => {
  if (!openingHoursText || openingHoursText.length === 0) {
    return { isOpen: false };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to 24-hour format (e.g., 1430 for 2:30 PM)

  // Map day numbers to day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[currentDay];

  // Find today's hours
  const todayHours = openingHoursText.find(line => line.startsWith(currentDayName));
  
  if (!todayHours) {
    return { isOpen: false };
  }

  // Check if it says "Closed"
  if (todayHours.includes('Closed')) {
    return { isOpen: false };
  }

  // Parse the time range (e.g., "8:30 AM – 5:30 PM")
  const timeMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*–\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
  
  if (!timeMatch) {
    return { isOpen: false };
  }

  const [, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = timeMatch;

  // Convert to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: string): number => {
    let h = parseInt(hour);
    const m = parseInt(minute);
    
    if (period === 'PM' && h !== 12) {
      h += 12;
    } else if (period === 'AM' && h === 12) {
      h = 0;
    }
    
    return h * 100 + m;
  };

  const openTime = convertTo24Hour(openHour, openMin, openPeriod);
  const closeTime = convertTo24Hour(closeHour, closeMin, closePeriod);

  // Handle cases where closing time is on the next day (e.g., open until 2 AM)
  let isOpen = false;
  let closesSoon = false;
  let opensSoon = false;
  let nextOpenTime = `${openHour}:${openMin} ${openPeriod}`;
  let nextCloseTime = `${closeHour}:${closeMin} ${closePeriod}`;

  if (closeTime < openTime) {
    // Restaurant closes after midnight
    isOpen = currentTime >= openTime || currentTime <= closeTime;
    
    if (isOpen) {
      // Check if closes within the next hour
      let timeUntilClose;
      if (currentTime >= openTime) {
        // It's after opening time, so closing time is tomorrow
        timeUntilClose = (2400 - currentTime) + closeTime;
      } else {
        // It's before opening time, so closing time is today
        timeUntilClose = closeTime - currentTime;
      }
      
      if (timeUntilClose > 0 && timeUntilClose <= 60) {
        closesSoon = true;
      }
    } else {
      // Check if opens within the next hour
      const timeUntilOpen = openTime - currentTime;
      if (timeUntilOpen > 0 && timeUntilOpen <= 60) {
        opensSoon = true;
      }
    }
  } else {
    // Restaurant closes on the same day
    isOpen = currentTime >= openTime && currentTime <= closeTime;
    
    if (isOpen) {
      // Check if closes within the next hour
      const timeUntilClose = closeTime - currentTime;
      if (timeUntilClose > 0 && timeUntilClose <= 60) {
        closesSoon = true;
      }
    } else if (currentTime < openTime) {
      // Check if opens within the next hour
      const timeUntilOpen = openTime - currentTime;
      if (timeUntilOpen > 0 && timeUntilOpen <= 60) {
        opensSoon = true;
      }
    }
  }

  return { 
    isOpen, 
    closesSoon, 
    opensSoon, 
    nextOpenTime, 
    nextCloseTime 
  };
};

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);
  const [restaurantStatus, setRestaurantStatus] = useState<{ isOpen: boolean; closesSoon?: boolean; opensSoon?: boolean; nextOpenTime?: string; nextCloseTime?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedRestaurant = localStorage.getItem(`cachedRestaurant_${id}`);
      if (cachedRestaurant) {
        const restaurantData = JSON.parse(cachedRestaurant);
        // Regenerate photo URLs for cached data
        if (restaurantData.photoReferences) {
          restaurantData.photos = restaurantData.photoReferences.map((photoRef: string) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
          );
        }
        setRestaurant(restaurantData);
        
        // Check restaurant status
        if (restaurantData.openingHoursText && restaurantData.openingHoursText.length > 0) {
          setRestaurantStatus(getRestaurantStatus(restaurantData.openingHoursText));
        }
        
        // Get travel time from cache or calculate
        const cachedTravelTime = localStorage.getItem(`cachedTravelTime_${id}`);
        if (cachedTravelTime) {
          setTravelTime(cachedTravelTime);
        } else {
          // Calculate travel time
          const userLocation = localStorage.getItem('userLocation');
          if (userLocation && restaurantData.location) {
            const { lat, lng } = JSON.parse(userLocation);
            const destLat = restaurantData.location.lat;
            const destLng = restaurantData.location.lng;
            try {
              const directionsRes = await fetch(`http://localhost:5001/api/restaurants/directions?origin=${lat},${lng}&destination=${destLat},${destLng}`);
              const directionsData = await directionsRes.json();
              if (directionsData.routes && directionsData.routes[0]) {
                const travelTimeText = directionsData.routes[0].legs[0].duration.text;
                setTravelTime(travelTimeText);
                localStorage.setItem(`cachedTravelTime_${id}`, travelTimeText);
              } else {
                setTravelTime('N/A');
              }
            } catch (error) {
              setTravelTime('N/A');
            }
          }
        }
        
        setLoading(false);
        return;
      }
      
      try {
        const data = await restaurantService.getRestaurantDetails(id!);
        setRestaurant(data);
        
        // Cache the restaurant details with photo references
        const restaurantForCache = {
          ...data,
          photoReferences: data.photos ? data.photos.map((photoUrl: string) => {
            const photoRefMatch = photoUrl.match(/photoreference=([^&]+)/);
            return photoRefMatch ? photoRefMatch[1] : null;
          }).filter(Boolean) : [],
          photos: [] // Don't cache the actual URLs
        };
        localStorage.setItem(`cachedRestaurant_${id}`, JSON.stringify(restaurantForCache));
        
        // Check restaurant status
        if (data.openingHoursText && data.openingHoursText.length > 0) {
          setRestaurantStatus(getRestaurantStatus(data.openingHoursText));
        }
        
        // Get user location from localStorage
        const userLocation = localStorage.getItem('userLocation');
        if (userLocation && data.location) {
          const { lat, lng } = JSON.parse(userLocation);
          const destLat = data.location.lat;
          const destLng = data.location.lng;
          // Fetch travel time from backend proxy
          const directionsRes = await fetch(`http://localhost:5001/api/restaurants/directions?origin=${lat},${lng}&destination=${destLat},${destLng}`);
          const directionsData = await directionsRes.json();
          if (directionsData.routes && directionsData.routes[0]) {
            const travelTimeText = directionsData.routes[0].legs[0].duration.text;
            setTravelTime(travelTimeText);
            localStorage.setItem(`cachedTravelTime_${id}`, travelTimeText);
          } else {
            setTravelTime('N/A');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  useEffect(() => {
    async function checkSaved() {
      if (!restaurant) return;
      try {
        const favorites = await restaurantService.getMyFavorites();
        setSaved(favorites.some((fav: any) => fav.place_id === restaurant.place_id));
      } catch (e) {
        setSaved(false);
      }
    }
    checkSaved();
  }, [restaurant]);

  const handleSave = async () => {
    if (!restaurant) return;
    setSaving(true);
    try {
      if (saved) {
        await restaurantService.removeFromFavorites(restaurant.place_id);
        setSaved(false);
      } else {
        await restaurantService.addToFavorites(restaurant.place_id, restaurant.name);
        setSaved(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading restaurant details..." />;
  if (error) return <div className="py-16 text-center text-red-600">{error}</div>;
  if (!restaurant) return null;

  // Helper function to get status display
  const getStatusDisplay = () => {
    if (!restaurantStatus) return null;

    const { isOpen, closesSoon, opensSoon, nextCloseTime, nextOpenTime } = restaurantStatus;

    if (closesSoon) {
      return (
        <div className="flex items-center mb-2">
          <Clock className="w-4 h-4 mr-2" style={{ color: '#f97316' }} />
          <span className="font-medium" style={{ color: '#ea580c' }}>
            Closes soon ({nextCloseTime})
          </span>
        </div>
      );
    }

    if (opensSoon) {
      return (
        <div className="flex items-center mb-2">
          <Clock className="w-4 h-4 mr-2 text-blue-500" />
          <span className="font-medium text-blue-600">
            Opens soon ({nextOpenTime})
          </span>
        </div>
      );
    }

    if (isOpen) {
      return (
        <div className="flex items-center mb-2">
          <Clock className="w-4 h-4 mr-2 text-green-500" />
          <span className="font-medium text-green-600">
            Open now
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center mb-2">
        <Clock className="w-4 h-4 mr-2 text-red-500" />
        <span className="font-medium text-red-600">
          Closed now
        </span>
      </div>
    );
  };

  // Helper to get restaurant image
  const getRestaurantImage = () => {
    if (restaurant?.photos && restaurant.photos.length > 0) {
      return restaurant.photos[0];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        {/* Restaurant Image */}
        {getRestaurantImage() ? (
          <div className="h-64 md:h-96 overflow-hidden mb-6 rounded">
            <img
              src={getRestaurantImage()!}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
            />
          </div>
        ) : (
          <div className="h-64 md:h-96 flex flex-col items-center justify-center bg-gray-200 mb-6 rounded">
            <span className="text-6xl font-bold text-gray-400">:(</span>
            <span className="text-sm text-gray-500 mt-2">No image available</span>
          </div>
        )}
        {/* Restaurant Name and Save Button Row */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${saved ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            <Heart className={`w-5 h-5 mr-2 ${saved ? 'fill-red-500' : ''}`} />
            {saving ? 'Saving...' : saved ? 'Unsave' : 'Save'}
          </button>
        </div>
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-2" />
          {restaurant.address}
        </div>
        {restaurant.rating && (
          <div className="flex items-center mb-2">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-lg font-medium text-gray-900">
              {restaurant.rating} {restaurant.totalRatings && `(${restaurant.totalRatings} reviews)`}
            </span>
          </div>
        )}
        {travelTime && (
          <div className="flex items-center mb-2">
            <Car className="w-4 h-4 mr-2 text-blue-500" />
            <span>Travel time by car: {travelTime}</span>
          </div>
        )}
        {/* Restaurant status display */}
        {getStatusDisplay()}
        {/* Full weekly opening hours */}
        {restaurant.openingHoursText && restaurant.openingHoursText.length > 0 && (
          <div className="mb-2 ml-6">
            <div className="font-semibold text-gray-700 mb-1">Hours:</div>
            <ul className="text-gray-600 text-sm">
              {restaurant.openingHoursText.map((line: string, idx: number) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {restaurant.yelp && restaurant.yelp.hours && (
          <div className="mb-2">
            <Clock className="w-4 h-4 mr-2 text-green-500 inline" />
            <span>Hours: {restaurant.yelp.hours.map((h: any, i: number) => (
              <span key={i}>{h.hours_type}: {h.open.map((o: any, j: number) => <span key={j}>{o.start}-{o.end} </span>)}</span>
            ))}</span>
          </div>
        )}
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-2">Reviews</h2>
        {restaurant.reviews && restaurant.reviews.length > 0 ? (
          <ul className="space-y-4">
            {restaurant.reviews.map((review: any, idx: number) => (
              <li key={idx} className="bg-gray-100 rounded p-4 text-left">
                <div className="font-semibold">{review.author_name || review.user?.name}</div>
                <div className="text-yellow-600">{review.rating} ⭐</div>
                <div className="text-gray-700 mt-2">{review.text}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No reviews available.</div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetailPage; 