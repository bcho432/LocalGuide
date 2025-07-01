import { Request, Response } from 'express';
import axios from 'axios';

// Eventbrite API service
const eventbriteApi = axios.create({
  baseURL: 'https://www.eventbriteapi.com/v3',
  headers: {
    'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`
  }
});

// Get events near a location
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10, startDate, endDate, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const params: any = {
      location: {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        within: `${radius}km`
      },
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
      params.location = {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        within: `${radius}km`
      };
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