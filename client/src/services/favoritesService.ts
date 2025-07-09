import api from './api';
import { restaurantService } from './restaurantService';
import { eventService } from './eventService';
import { hotelService } from './hotelService';

export interface SavedItem {
  id: number;
  place_id: string;
  place_name: string;
  place_type: 'restaurant' | 'event' | 'hotel';
  created_at: string;
  details?: any; // Will be populated with full details when fetched
}

export const favoritesService = {
  async getAllFavorites(): Promise<SavedItem[]> {
    try {
      // Get all favorites from the database
      const response = await api.get('/api/users/favorites');
      const favorites = response.data.favorites || [];
      
      // Fetch full details for each favorite
      const favoritesWithDetails = await Promise.all(
        favorites.map(async (favorite: SavedItem) => {
          try {
            let details;
            switch (favorite.place_type) {
              case 'restaurant':
                details = await restaurantService.getRestaurantDetails(favorite.place_id);
                break;
              case 'event':
                details = await eventService.getEventDetails(favorite.place_id);
                break;
              case 'hotel':
                details = await hotelService.getHotelDetails(favorite.place_id);
                break;
            }
            return { ...favorite, details };
          } catch (error) {
            console.error(`Failed to fetch details for ${favorite.place_type} ${favorite.place_id}:`, error);
            return favorite; // Return without details if fetch fails
          }
        })
      );
      
      return favoritesWithDetails;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      return [];
    }
  },

  async getFavoritesByType(type: 'restaurant' | 'event' | 'hotel'): Promise<SavedItem[]> {
    try {
      let response;
      switch (type) {
        case 'restaurant':
          response = await api.get('/api/restaurants/favorites/my');
          break;
        case 'event':
          response = await api.get('/api/events/favorites/my');
          break;
        case 'hotel':
          response = await api.get('/api/hotels/favorites/my');
          break;
      }
      return response.data.favorites || [];
    } catch (error) {
      console.error(`Failed to fetch ${type} favorites:`, error);
      return [];
    }
  },

  async removeFavorite(placeId: string, placeType: 'restaurant' | 'event' | 'hotel'): Promise<void> {
    try {
      switch (placeType) {
        case 'restaurant':
          await restaurantService.removeFromFavorites(placeId);
          break;
        case 'event':
          await eventService.removeFromFavorites(placeId);
          break;
        case 'hotel':
          await hotelService.removeFromFavorites(placeId);
          break;
      }
    } catch (error) {
      console.error(`Failed to remove ${placeType} from favorites:`, error);
      throw error;
    }
  }
}; 