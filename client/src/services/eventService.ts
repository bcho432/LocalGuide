import api from './api';

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: {
    local: string;
    utc: string;
  };
  endDate: {
    local: string;
    utc: string;
  };
  timezone: string;
  url: string;
  logo?: string;
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  category?: {
    id: string;
    name: string;
    shortName: string;
  };
  format: string;
  isFree: boolean;
  ticketAvailability: {
    has_available_tickets: boolean;
    minimum_ticket_price?: {
      currency: string;
      value: number;
      major_value: string;
      display: string;
    };
    maximum_ticket_price?: {
      currency: string;
      value: number;
      major_value: string;
      display: string;
    };
  };
  capacity?: number;
  status: string;
}

export interface EventDetails extends Event {
  banner?: string;
  organizer?: {
    id: string;
    name: string;
    description: string;
    website: string;
    logo?: string;
  };
  tickets?: any[];
  attendees?: number;
  created: string;
  changed: string;
  published: string;
}

export interface EventFilters {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  price?: string;
  format?: string;
  isFree?: boolean;
}

export const eventService = {
  async getNearbyEvents(lat: number, lng: number, radius: number = 10): Promise<Event[]> {
    const response = await api.get('/api/events/nearby', {
      params: { lat, lng, radius }
    });
    return response.data.events;
  },

  async searchEvents(filters: EventFilters): Promise<Event[]> {
    const response = await api.get('/api/events/search', {
      params: filters
    });
    return response.data.events;
  },

  async getEventDetails(eventId: string): Promise<EventDetails> {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data.event;
  },

  async addToFavorites(eventId: string, eventName: string): Promise<void> {
    await api.post(`/api/events/${eventId}/favorite`, { eventName });
  },

  async removeFromFavorites(eventId: string): Promise<void> {
    await api.delete(`/api/events/${eventId}/favorite`);
  },

  async getMyFavorites(): Promise<any[]> {
    const response = await api.get('/api/events/favorites/my');
    return response.data.favorites;
  },
}; 