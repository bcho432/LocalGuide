import api from './api';

export interface Hotel {
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
  photos: any[];
  openingHours?: boolean;
  phone?: string;
  website?: string;
  vicinity?: string;
  distance?: number;
}

export interface HotelDetails extends Hotel {
  reviews?: any[];
  openingHoursText?: string[];
}

export interface HotelFilters {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  openNow?: boolean;
}

export const hotelService = {
  async getNearbyHotels(lat: number, lng: number, radius: number = 10000): Promise<Hotel[]> {
    const response = await api.get('/api/hotels/nearby', {
      params: { lat, lng, radius }
    });
    return response.data.hotels;
  },

  async searchHotels(filters: HotelFilters): Promise<Hotel[]> {
    const response = await api.get('/api/hotels/search', {
      params: filters
    });
    return response.data.hotels;
  },

  async getHotelDetails(placeId: string): Promise<HotelDetails> {
    const response = await api.get(`/api/hotels/${placeId}`);
    return response.data.hotel;
  },

  async addToFavorites(placeId: string, hotelName: string): Promise<void> {
    await api.post(`/api/hotels/${placeId}/favorite`, { hotelName });
  },

  async removeFromFavorites(placeId: string): Promise<void> {
    await api.delete(`/api/hotels/${placeId}/favorite`);
  },

  async getMyFavorites(): Promise<any[]> {
    const response = await api.get('/api/hotels/favorites/my');
    return response.data.favorites;
  },
}; 