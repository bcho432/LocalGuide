import api from './api';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  types: string[];
  photos: string[];
  openingHours?: boolean;
  yelpUrl?: string;
  phone?: string;
  categories?: string[];
}

export interface RestaurantDetails extends Restaurant {
  website?: string;
  reviews?: any[];
  yelp?: any;
}

export interface RestaurantFilters {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  openNow?: boolean;
  cuisine?: string;
}

export interface ReviewRequest {
  rating: number;
  reviewText?: string;
  placeName: string;
}

export const restaurantService = {
  async getNearbyRestaurants(lat: number, lng: number, radius: number = 1500): Promise<Restaurant[]> {
    const response = await api.get('/api/restaurants/nearby', {
      params: { lat, lng, radius }
    });
    return response.data.restaurants;
  },

  async searchRestaurants(filters: RestaurantFilters): Promise<Restaurant[]> {
    const response = await api.get('/api/restaurants/search', {
      params: filters
    });
    return response.data.restaurants;
  },

  async getRestaurantDetails(placeId: string): Promise<RestaurantDetails> {
    const response = await api.get(`/api/restaurants/${placeId}`);
    return response.data.restaurant;
  },

  async addReview(placeId: string, review: ReviewRequest): Promise<void> {
    await api.post(`/api/restaurants/${placeId}/reviews`, review);
  },

  async getMyReviews(): Promise<any[]> {
    const response = await api.get('/api/restaurants/reviews/my');
    return response.data.reviews;
  },

  async addToFavorites(placeId: string, placeName: string): Promise<void> {
    await api.post(`/api/restaurants/${placeId}/favorite`, { placeName });
  },

  async removeFromFavorites(placeId: string): Promise<void> {
    await api.delete(`/api/restaurants/${placeId}/favorite`);
  },

  async getMyFavorites(): Promise<any[]> {
    const response = await api.get('/api/restaurants/favorites/my');
    return response.data.favorites;
  },
}; 