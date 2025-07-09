import { Request, Response } from 'express';
import axios from 'axios';

interface Hotel {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  formatted_phone_number?: string;
  website?: string;
  url?: string;
}

export const searchNearbyHotels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = '5000', type = 'lodging' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
      return;
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is not configured');
      res.status(500).json({ 
        success: false, 
        error: 'Google Maps API key is not configured' 
      });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
      location: `${lat},${lng}`,
      radius: radius,
      type: type,
      key: GOOGLE_MAPS_API_KEY
    };

    console.log('Fetching hotels with params:', { lat, lng, radius, type });

    const response = await axios.get(url, { params });
    const data = response.data;

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      res.status(500).json({ 
        success: false, 
        error: `Failed to fetch hotels from Google Places API: ${data.status}` 
      });
      return;
    }

    const hotels = data.results || [];
    console.log(`Found ${hotels.length} hotels`);

    // Enhance hotel data with additional details (but don't fail if details can't be fetched)
    const enhancedHotels = await Promise.all(
      hotels.map(async (hotel: Hotel) => {
        try {
          // Get detailed information for each hotel
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
          const detailsParams = {
            place_id: hotel.place_id,
            fields: 'formatted_phone_number,website,opening_hours,photos,price_level',
            key: GOOGLE_MAPS_API_KEY
          };

          const detailsResponse = await axios.get(detailsUrl, { params: detailsParams });
          const details = detailsResponse.data.result;

          return {
            place_id: hotel.place_id,
            name: hotel.name,
            vicinity: hotel.vicinity,
            rating: hotel.rating,
            user_ratings_total: hotel.user_ratings_total,
            price_level: details?.price_level || hotel.price_level,
            photos: hotel.photos,
            location: hotel.geometry.location,
            types: hotel.types,
            opening_hours: details?.opening_hours,
            phone: details?.formatted_phone_number,
            website: details?.website,
            google_url: hotel.url
          };
        } catch (error) {
          console.error(`Error fetching details for hotel ${hotel.place_id}:`, error);
          // Return basic hotel info if details fetch fails
          return {
            place_id: hotel.place_id,
            name: hotel.name,
            vicinity: hotel.vicinity,
            rating: hotel.rating,
            user_ratings_total: hotel.user_ratings_total,
            price_level: hotel.price_level,
            photos: hotel.photos,
            location: hotel.geometry.location,
            types: hotel.types,
            opening_hours: hotel.opening_hours,
            google_url: hotel.url
          };
        }
      })
    );

    res.json({
      success: true,
      hotels: enhancedHotels
    });

  } catch (error) {
    console.error('Error searching nearby hotels:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getHotelDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { place_id } = req.params;

    if (!place_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Place ID is required' 
      });
      return;
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is not configured');
      res.status(500).json({ 
        success: false, 
        error: 'Google Maps API key is not configured' 
      });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const params = {
      place_id: place_id,
      fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,photos,price_level,rating,user_ratings_total,geometry,types,url,reviews',
      key: GOOGLE_MAPS_API_KEY
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      res.status(500).json({ 
        success: false, 
        error: `Failed to fetch hotel details from Google Places API: ${data.status}` 
      });
      return;
    }

    const hotel = data.result;

    // Get directions if user location is provided
    let travelTime = null;
    const userLocation = req.query.userLocation;
    if (userLocation && hotel.geometry) {
      try {
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json`;
        const directionsParams = {
          origin: userLocation,
          destination: `${hotel.geometry.location.lat},${hotel.geometry.location.lng}`,
          key: GOOGLE_MAPS_API_KEY
        };

        const directionsResponse = await axios.get(directionsUrl, { params: directionsParams });
        const directionsData = directionsResponse.data;

        if (directionsData.routes && directionsData.routes[0]) {
          travelTime = directionsData.routes[0].legs[0].duration.text;
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    }

    res.json({
      success: true,
      hotel: {
        ...hotel,
        travel_time: travelTime
      }
    });

  } catch (error) {
    console.error('Error getting hotel details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}; 