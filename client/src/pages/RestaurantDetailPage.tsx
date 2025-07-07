import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Star, Car } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';

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

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const data = await restaurantService.getRestaurantDetails(id!);
        setRestaurant(data);
        
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
            setTravelTime(directionsData.routes[0].legs[0].duration.text);
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

  if (loading) return <div className="py-16 text-center">Loading...</div>;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
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