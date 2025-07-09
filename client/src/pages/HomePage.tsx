import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { 
  MapPin, 
  Search, 
  Utensils, 
  Calendar, 
  Star, 
  Heart,
  ArrowRight,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage: React.FC = () => {
  const { currentLocation, getCurrentLocation, isLoading } = useLocation();

  const features = [
    {
      icon: Utensils,
      title: 'Restaurant Discovery',
      description: 'Find the best restaurants near you with detailed reviews, ratings, and photos.'
    },
    {
      icon: Calendar,
      title: 'Event Discovery',
      description: 'Discover local events, concerts, and activities happening around you.'
    },
    {
      icon: MapPin,
      title: 'Location-Based',
      description: 'Get personalized recommendations based on your current location.'
    },
    {
      icon: Star,
      title: 'User Reviews',
      description: 'Read and write reviews to help others discover great places.'
    },
    {
      icon: Heart,
      title: 'Favorites',
      description: 'Save your favorite restaurants and events for quick access.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Join a community of food lovers and event enthusiasts.'
    }
  ];

  const stats = [
    { label: 'Restaurants', value: '10,000+', icon: Utensils },
    { label: 'Events', value: '5,000+', icon: Calendar },
    { label: 'Users', value: '50,000+', icon: Users },
    { label: 'Reviews', value: '100,000+', icon: Star },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Places
              <span className="block text-2xl md:text-3xl font-normal mt-2">
                Near You
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Find the best restaurants and local events based on your location, 
              preferences, and current time.
            </p>
            
            {/* Location Button */}
            <div className="mb-8">
              {currentLocation ? (
                <div className="flex items-center justify-center space-x-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{currentLocation.address || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}</span>
                </div>
              ) : (
                <button
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" message="" className="mr-2" />
                  ) : (
                    <span className="mr-2">📍</span>
                  )}
                  {isLoading ? 'Getting Location...' : 'Get My Location'}
                </button>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/restaurants"
                className="btn btn-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3 flex items-center justify-center"
              >
                <Utensils className="w-5 h-5 mr-2" />
                Find Restaurants
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/events"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3 flex items-center justify-center"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Find Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose LocalGuide?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine the power of multiple APIs to give you the most comprehensive 
              local discovery experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card hover-card p-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Share Your Location
              </h3>
              <p className="text-gray-600">
                Allow us to access your location or enter your address to get started.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Browse Recommendations
              </h3>
              <p className="text-gray-600">
                Explore restaurants and events near you with detailed information and reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Save & Review
              </h3>
              <p className="text-gray-600">
                Save your favorites and share your experiences with the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Discover?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who are already discovering amazing places near them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Get Started Free
            </Link>
            <Link
              to="/restaurants"
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3"
            >
              Browse Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 