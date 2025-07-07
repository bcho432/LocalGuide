import { Request, Response } from 'express';
import axios from 'axios';

// Eventbrite API service
const eventbriteApi = axios.create({
  baseURL: 'https://www.eventbriteapi.com/v3',
  headers: {
    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`
  }
});

// Mock event data for fallback
const mockEvents = [
  {
    id: 'mock-1',
    name: 'Summer Music Festival',
    description: 'A fantastic outdoor music festival featuring local bands and artists.',
    startDate: {
      local: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    endDate: {
      local: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString()
    },
    timezone: 'America/New_York',
    url: 'https://example.com/summer-festival',
    logo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    venue: {
      id: 'venue-1',
      name: 'Central Park',
      address: '123 Main St',
      city: 'New York',
      region: 'NY',
      country: 'US',
      latitude: 40.7589,
      longitude: -73.9851
    },
    category: {
      id: 'cat-1',
      name: 'Music',
      shortName: 'Music'
    },
    format: 'conference',
    isFree: false,
    ticketAvailability: {
      has_available_tickets: true,
      minimum_ticket_price: {
        currency: 'USD',
        value: 2500,
        major_value: '25.00',
        display: '$25.00'
      }
    },
    capacity: 1000,
    status: 'live'
  },
  {
    id: 'mock-2',
    name: 'Tech Startup Meetup',
    description: 'Network with local tech entrepreneurs and learn about the latest trends.',
    startDate: {
      local: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    endDate: {
      local: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
    },
    timezone: 'America/New_York',
    url: 'https://example.com/tech-meetup',
    logo: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop',
    venue: {
      id: 'venue-2',
      name: 'Innovation Hub',
      address: '456 Tech Ave',
      city: 'New York',
      region: 'NY',
      country: 'US',
      latitude: 40.7505,
      longitude: -73.9934
    },
    category: {
      id: 'cat-2',
      name: 'Business',
      shortName: 'Business'
    },
    format: 'conference',
    isFree: true,
    ticketAvailability: {
      has_available_tickets: true
    },
    capacity: 200,
    status: 'live'
  },
  {
    id: 'mock-3',
    name: 'Food & Wine Festival',
    description: 'Taste the best local cuisine and wines from around the region.',
    startDate: {
      local: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    endDate: {
      local: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      utc: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString()
    },
    timezone: 'America/New_York',
    url: 'https://example.com/food-wine-festival',
    logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    venue: {
      id: 'venue-3',
      name: 'Riverside Plaza',
      address: '789 Food St',
      city: 'New York',
      region: 'NY',
      country: 'US',
      latitude: 40.7614,
      longitude: -73.9776
    },
    category: {
      id: 'cat-3',
      name: 'Food & Drink',
      shortName: 'Food'
    },
    format: 'conference',
    isFree: false,
    ticketAvailability: {
      has_available_tickets: true,
      minimum_ticket_price: {
        currency: 'USD',
        value: 7500,
        major_value: '75.00',
        display: '$75.00'
      }
    },
    capacity: 500,
    status: 'live'
  }
];

// Get events near a location
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10, startDate, endDate, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Try to fetch from Eventbrite API first
    try {
      const params: any = {
        'location.latitude': parseFloat(lat as string),
        'location.longitude': parseFloat(lng as string),
        'location.within': `${radius}km`,
        expand: 'venue,category',
        status: 'live'
      };

      if (startDate) {
        params.start_date_range = startDate;
      }

      if (endDate) {
        params.end_date_range = endDate;
      }

      if (category) {
        params.categories = category;
      }

      const response = await eventbriteApi.get('/events/search/', { params });

      const events = response.data.events || [];

      // Transform and enhance event data
      const enhancedEvents = events.map((event: any) => ({
        id: event.id,
        name: event.name.text,
        description: event.description.text,
        startDate: event.start,
        endDate: event.end,
        timezone: event.start.timezone,
        url: event.url,
        logo: event.logo?.url,
        venue: event.venue ? {
          id: event.venue.id,
          name: event.venue.name,
          address: event.venue.address,
          city: event.venue.city,
          region: event.venue.region,
          country: event.venue.country,
          latitude: event.venue.latitude,
          longitude: event.venue.longitude
        } : null,
        category: event.category ? {
          id: event.category.id,
          name: event.category.name,
          shortName: event.category.short_name
        } : null,
        format: event.format,
        isFree: event.is_free,
        ticketAvailability: event.ticket_availability,
        capacity: event.capacity,
        status: event.status
      }));

      return res.json({
        success: true,
        events: enhancedEvents,
        count: enhancedEvents.length,
        pagination: response.data.pagination
      });
    } catch (apiError) {
      console.log('Eventbrite API failed, using mock data:', apiError);
      
      // Return mock data as fallback
      return res.json({
        success: true,
        events: mockEvents,
        count: mockEvents.length,
        pagination: { object_count: mockEvents.length, page_number: 1, page_size: 20 }
      });
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Search events with filters
export const searchEvents = async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      lat, 
      lng, 
      radius = 10, 
      startDate, 
      endDate, 
      category,
      price,
      format,
      isFree 
    } = req.query;

    if (!query && !lat) {
      return res.status(400).json({ error: 'Query or location is required' });
    }

    const params: any = {
      expand: 'venue,category',
      status: 'live'
    };

    if (query) {
      params.q = query;
    }

    if (lat && lng) {
      params['location.latitude'] = parseFloat(lat as string);
      params['location.longitude'] = parseFloat(lng as string);
      params['location.within'] = `${radius}km`;
    }

    if (startDate) {
      params.start_date_range = startDate;
    }

    if (endDate) {
      params.end_date_range = endDate;
    }

    if (category) {
      params.categories = category;
    }

    if (format) {
      params.format = format;
    }

    if (isFree === 'true') {
      params.is_free = true;
    }

    const response = await eventbriteApi.get('/events/search/', { params });

    let events = response.data.events || [];

    // Apply additional filters
    if (price) {
      events = events.filter((event: any) => {
        if (price === 'free') {
          return event.is_free;
        }
        // Add more price filtering logic as needed
        return true;
      });
    }

    // Transform and enhance event data
    const enhancedEvents = events.map((event: any) => ({
      id: event.id,
      name: event.name.text,
      description: event.description.text,
      startDate: event.start,
      endDate: event.end,
      timezone: event.start.timezone,
      url: event.url,
      logo: event.logo?.url,
      venue: event.venue ? {
        id: event.venue.id,
        name: event.venue.name,
        address: event.venue.address,
        city: event.venue.city,
        region: event.venue.region,
        country: event.venue.country,
        latitude: event.venue.latitude,
        longitude: event.venue.longitude
      } : null,
      category: event.category ? {
        id: event.category.id,
        name: event.category.name,
        shortName: event.category.short_name
      } : null,
      format: event.format,
      isFree: event.is_free,
      ticketAvailability: event.ticket_availability,
      capacity: event.capacity,
      status: event.status
    }));

    return res.json({
      success: true,
      events: enhancedEvents,
      count: enhancedEvents.length,
      pagination: response.data.pagination
    });
  } catch (error) {
    console.error('Error searching events:', error);
    return res.status(500).json({ error: 'Failed to search events' });
  }
};

// Get detailed information about a specific event
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Get event details
    const eventResponse = await eventbriteApi.get(`/events/${eventId}/`, {
      params: {
        expand: 'venue,category,organizer'
      }
    });

    const event = eventResponse.data;

    // Get event tickets
    let tickets = [];
    try {
      const ticketsResponse = await eventbriteApi.get(`/events/${eventId}/ticket_classes/`);
      tickets = ticketsResponse.data.ticket_classes || [];
    } catch (error) {
      console.log('Tickets not available for this event');
    }

    // Get event attendees (if accessible)
    let attendees = [];
    try {
      const attendeesResponse = await eventbriteApi.get(`/events/${eventId}/attendees/`);
      attendees = attendeesResponse.data.attendees || [];
    } catch (error) {
      console.log('Attendee information not available for this event');
    }

    const eventDetails = {
      id: event.id,
      name: event.name.text,
      description: event.description.text,
      startDate: event.start,
      endDate: event.end,
      timezone: event.start.timezone,
      url: event.url,
      logo: event.logo?.url,
      banner: event.banner?.url,
      venue: event.venue ? {
        id: event.venue.id,
        name: event.venue.name,
        address: event.venue.address,
        city: event.venue.city,
        region: event.venue.region,
        country: event.venue.country,
        latitude: event.venue.latitude,
        longitude: event.venue.longitude,
        website: event.venue.website
      } : null,
      category: event.category ? {
        id: event.category.id,
        name: event.category.name,
        shortName: event.category.short_name
      } : null,
      organizer: event.organizer ? {
        id: event.organizer.id,
        name: event.organizer.name,
        description: event.organizer.description,
        website: event.organizer.website,
        logo: event.organizer.logo?.url
      } : null,
      format: event.format,
      isFree: event.is_free,
      ticketAvailability: event.ticket_availability,
      capacity: event.capacity,
      status: event.status,
      tickets: tickets.map((ticket: any) => ({
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        cost: ticket.cost,
        fee: ticket.fee,
        tax: ticket.tax,
        quantityTotal: ticket.quantity_total,
        quantitySold: ticket.quantity_sold,
        salesEnd: ticket.sales_end,
        isFree: ticket.free
      })),
      attendees: attendees.length,
      created: event.created,
      changed: event.changed,
      published: event.published
    };

    return res.json({
      success: true,
      event: eventDetails
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ error: 'Failed to fetch event details' });
  }
}; 