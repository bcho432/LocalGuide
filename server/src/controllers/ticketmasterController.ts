import { Request, Response } from 'express';
import axios from 'axios';

export const getTicketmasterEvents = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10, keyword, segmentId, startDateTime, endDateTime } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const params: any = {
      apikey: process.env.TICKETMASTER_API_KEY,
      latlong: `${lat},${lng}`,
      radius,
      unit: 'km',
      size: 20,
      sort: 'date,asc'
    };
    if (keyword) params.keyword = keyword;
    if (segmentId) params.segmentId = segmentId;
    if (startDateTime) params.startDateTime = startDateTime;
    if (endDateTime) params.endDateTime = endDateTime;

    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params });

    const events = (response.data._embedded?.events || []).map((event: any) => ({
      id: event.id,
      name: event.name,
      url: event.url,
      image: event.images?.[0]?.url,
      date: event.dates?.start?.localDate,
      time: event.dates?.start?.localTime,
      venue: event._embedded?.venues?.[0]?.name,
      address: event._embedded?.venues?.[0]?.address?.line1,
      city: event._embedded?.venues?.[0]?.city?.name,
      country: event._embedded?.venues?.[0]?.country?.name,
      category: event.classifications?.[0]?.segment?.name,
    }));

    res.json({ success: true, events });
    return;
  } catch (error: any) {
    console.error('Ticketmaster API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch events from Ticketmaster' });
    return;
  }
}; 