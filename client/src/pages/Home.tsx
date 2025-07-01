import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const Home: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location.');
        setLoadingLocation(false);
      }
    );
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
          <button
            className="btn btn-white text-primary-600 font-semibold shadow-md mb-8 px-8 py-3 text-lg hover:scale-105 transition-transform"
            onClick={handleGetLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? 'Getting Location...' : 'Get My Location'}
          </button>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/restaurants" className="btn btn-outline text-white border-white font-semibold shadow-md px-8 py-3 text-lg hover:bg-white hover:text-primary-600 hover:scale-105 transition-transform">Find Restaurants</a>
            <a href="/events" className="btn btn-outline text-white border-white font-semibold shadow-md px-8 py-3 text-lg hover:bg-white hover:text-primary-600 hover:scale-105 transition-transform">Find Events</a>
          </div>
          {locationError && <div className="text-red-200 font-semibold mt-2">{locationError}</div>}
        </div>
      </section>

      {/* Map Section */}
      {location && (
        <div className="w-full flex justify-center bg-white py-8">
          <div className="w-full max-w-2xl h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
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
