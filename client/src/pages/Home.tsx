import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// TypeScript module declarations for PNG imports
declare module '*.png';

// Fix leaflet's default icon path
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const features = [
  {
    icon: '🍽️',
    title: 'Personalized Recommendations',
    description: 'Get suggestions tailored to your tastes and location.'
  },
  {
    icon: '⭐',
    title: 'Verified Reviews',
    description: 'Read real reviews from our trusted community.'
  },
  {
    icon: '📅',
    title: 'Local Events',
    description: 'Discover events happening near you, updated daily.'
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    description: 'Your data is protected and never shared without consent.'
  }
];

const steps = [
  {
    icon: '📍',
    title: 'Share Your Location',
    description: 'Allow location access to get the best local results.'
  },
  {
    icon: '🔎',
    title: 'Browse & Discover',
    description: 'Explore restaurants and events tailored for you.'
  },
  {
    icon: '❤️',
    title: 'Save Your Favorites',
    description: 'Bookmark places and events you love for easy access.'
  },
  {
    icon: '📝',
    title: 'Leave a Review',
    description: 'Share your experience and help others discover great spots.'
  }
];

const testimonials = [
  {
    name: 'Alex J.',
    text: '“I found my new favorite restaurant thanks to LocalGuide!”'
  },
  {
    name: 'Maria S.',
    text: '“The event recommendations are always spot on. Love it!”'
  },
  {
    name: 'Chris P.',
    text: '“Super easy to use and the reviews are really helpful.”'
  }
];

const stats = [
  { icon: '🍽️', value: '10,000+', label: 'Restaurants' },
  { icon: '📅', value: '5,000+', label: 'Events' },
  { icon: '👤', value: '50,000+', label: 'Users' },
  { icon: '⭐', value: '100,000+', label: 'Reviews' },
];

// MapUpdater component to recenter map
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
};

const Home: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState<string>('');
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchNearbyRestaurants(lat: number, lng: number) {
    try {
      const response = await fetch(`http://localhost:5001/api/restaurants/nearby?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  }

  // Geocode address to coordinates
  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else if (data.status === 'ZERO_RESULTS') {
        throw new Error('Address not found. Please try a different location.');
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Geocoding service is not available.');
      } else {
        throw new Error(`Geocoding error: ${data.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to geocode address. Please try again.');
    }
  };

  // Get address suggestions for autocomplete
  const getAddressSuggestions = async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/restaurants/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await response.json();
      if (data.success && data.predictions) {
        const suggestions = data.predictions.map((prediction: any) => ({
          description: prediction.description,
          place_id: prediction.place_id
        }));
        setSuggestions(suggestions);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleGetLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(coords);
        localStorage.setItem('userLocation', JSON.stringify(coords));
        setLoadingLocation(false);
        setSearchedAddress('');
        // Fetch restaurants
        const results = await fetchNearbyRestaurants(coords.lat, coords.lng);
        setRestaurants(results);
        // Save to localStorage for caching
        localStorage.setItem('cachedRestaurants', JSON.stringify(results));
        localStorage.setItem('cachedLocation', JSON.stringify(coords));
      },
      (error) => {
        setLocationError('Unable to retrieve your location.');
        setLoadingLocation(false);
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!searchAddress.trim()) {
      setLocationError('Please enter an address to search.');
      return;
    }
    setSearchingLocation(true);
    setLocationError(null);
    setShowSuggestions(false);
    try {
      let coords;
      if (selectedPlaceId) {
        // Use place_id for geocoding
        const response = await fetch(`http://localhost:5001/api/restaurants/geocode?placeId=${selectedPlaceId}`);
        const data = await response.json();
        if (!data.lat || !data.lng) throw new Error('Location not found');
        coords = { lat: data.lat, lng: data.lng };
      } else {
        // Fallback to address
        const response = await fetch(`http://localhost:5001/api/restaurants/geocode?address=${encodeURIComponent(searchAddress.trim())}`);
        const data = await response.json();
        if (!data.lat || !data.lng) throw new Error('Location not found');
        coords = { lat: data.lat, lng: data.lng };
      }
      setLocation(coords);
      localStorage.setItem('userLocation', JSON.stringify(coords));
      setSearchingLocation(false);
      setSearchedAddress(searchAddress.trim());
      setSelectedPlaceId(null);
      // Fetch restaurants
      const results = await fetchNearbyRestaurants(coords.lat, coords.lng);
      setRestaurants(results);
      // Save to localStorage for caching
      localStorage.setItem('cachedRestaurants', JSON.stringify(results));
      localStorage.setItem('cachedLocation', JSON.stringify(coords));
    } catch (error) {
      setLocationError('Unable to find that address. Please try a different location.');
      setSearchingLocation(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: { description: string; place_id: string }) => {
    setSearchAddress(suggestion.description);
    setSelectedPlaceId(suggestion.place_id);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearchLocation();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Debounced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchAddress(value);
    setSelectedSuggestionIndex(-1);
    
    // Debounce the autocomplete request
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      getAddressSuggestions(value);
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-screen min-w-full bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden shadow-lg" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative w-full py-28 text-center flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">Discover Amazing Places</h1>
          <h2 className="text-2xl md:text-3xl font-medium mb-6 opacity-90">Near You</h2>
          <p className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto opacity-95 font-medium">
            Find the best restaurants and local events based on your location, preferences, and current time.
          </p>
          <p className="text-base md:text-lg mb-6 max-w-2xl mx-auto opacity-90">
            Click 'Get My Location' or enter an address to start right away!
          </p>
          
          {/* Location Options */}
          <div className="flex flex-col lg:flex-row gap-4 justify-center items-center mb-8 w-full max-w-4xl mx-auto lg:pl-16">
            {/* Get Current Location */}
            <div className="flex flex-col items-center">
              <button
                className="btn btn-white text-primary-600 font-semibold shadow-md px-8 py-3 text-lg hover:scale-105 transition-transform mb-2"
                onClick={handleGetLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? 'Getting Location...' : '📍 Get My Location'}
              </button>
              <p className="text-sm opacity-80">Use your current location</p>
            </div>
            
            {/* Divider */}
            <div className="text-white text-lg font-bold">OR</div>
            
            {/* Search Location */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-2 relative items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter an address (e.g., 'Times Square, NY')"
                    value={searchAddress}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchAddress.length >= 3 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 shadow-lg min-w-80 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300"
                    disabled={searchingLocation}
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.place_id}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                            index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          <div className="flex items-center">
                            <span className="text-gray-600 mr-2">📍</span>
                            <span className="text-gray-900">{suggestion.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-white text-primary-600 font-semibold shadow-md px-4 py-2 text-base hover:scale-105 transition-transform"
                  onClick={handleSearchLocation}
                  disabled={searchingLocation}
                >
                  {searchingLocation ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
              <p className="text-sm opacity-80 mt-2 text-left w-full">Select a location then press Enter to search</p>
            </div>
          </div>
          
          {location && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 mt-8 animate-fade-in">
              <a href="/restaurants" className="btn btn-outline text-white border-white font-semibold shadow-md px-8 py-3 text-lg hover:bg-white hover:text-primary-600 hover:scale-105 transition-transform">Find Restaurants</a>
              <a href="/events" className="btn btn-outline text-white border-white font-semibold shadow-md px-8 py-3 text-lg hover:bg-white hover:text-primary-600 hover:scale-105 transition-transform">Find Events</a>
            </div>
          )}
          {locationError && <div className="text-red-200 font-semibold mt-2">{locationError}</div>}
        </div>
      </section>

      {/* Guidance Message */}
      {location && (
        <div className="w-full bg-blue-50 py-6 border-b border-blue-200">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-blue-800 font-medium">
              {searchedAddress 
                ? `Great! Found location for "${searchedAddress}". Now you can click 'Find Restaurants' or 'Find Events' to find local restaurants or events going on in that area!`
                : "Great! Now you can click 'Find Restaurants' or 'Find Events' to find local restaurants or events going on in your area!"
              }
            </p>
          </div>
        </div>
      )}

      {/* Map Section */}
      {location && (
        <div className="w-full flex justify-center bg-white py-8">
          <div className="w-full max-w-2xl h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <MapUpdater center={[location.lat, location.lng]} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>You are here!</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Restaurant List Section */}
      {restaurants.length > 0 && (
        <div className="max-w-4xl mx-auto my-8">
          <h2 className="text-xl font-bold mb-4">Nearby Restaurants</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <div key={r.place_id} className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{r.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{r.vicinity}</p>
                {r.rating && (
                  <p className="text-sm text-yellow-600 mb-2">⭐ {r.rating} {r.user_ratings_total && `(${r.user_ratings_total} reviews)`}</p>
                )}
                {r.phone && (
                  <p className="text-sm text-gray-600 mb-2">📞 {r.phone}</p>
                )}
                {r.yelpUrl && (
                  <a 
                    href={r.yelpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    View on Yelp →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Stats Section */}
        <section className="py-14 bg-gray-50 w-full shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-extrabold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50 w-full border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-center mb-14 text-gray-900">Why Use LocalGuide?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {features.map((feature) => (
                <div key={feature.title} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white w-full">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-center mb-14 text-gray-900">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {steps.map((step, idx) => (
                <div key={step.title} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 flex items-center justify-center rounded-full bg-primary-100 text-4xl mb-4 shadow-md">{step.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Step {idx + 1}: {step.title}</h3>
                  <p className="text-gray-600 font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50 w-full">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-center mb-14 text-gray-900">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4 text-primary-600">"</div>
                  <p className="text-gray-700 italic mb-4 font-medium">{t.text}</p>
                  <div className="font-semibold text-primary-600">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="w-screen min-w-full py-14 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-center shadow-inner" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <h2 className="text-3xl font-extrabold mb-4">Ready to start exploring?</h2>
          <p className="mb-6 text-lg">Sign up now and discover the best your city has to offer!</p>
          <a href="/register" className="btn btn-white text-primary-600 font-semibold shadow-md px-8 py-3 text-lg hover:scale-105 transition-transform">Get Started</a>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-screen min-w-full bg-gray-900 text-gray-300 py-8" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-12">
          <div className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} LocalGuide. All rights reserved.</div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white">About</a>
            <a href="#" className="hover:text-white">Contact</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
