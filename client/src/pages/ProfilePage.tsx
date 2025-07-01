import React from 'react';
import { User, Settings, Heart, Star } from 'lucide-react';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            User Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your account settings and view your activity.
          </p>
        </div>

        <div className="card p-8 text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Profile Management Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            This page will feature user profile management, activity history, 
            favorites, and account settings.
          </p>
          <div className="flex items-center justify-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>Reviews</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 