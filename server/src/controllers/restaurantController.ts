import { Request, Response } from 'express';
import axios from 'axios';

// Google Places API service
const googlePlacesApi = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  params: {
    key: process.env.GOOGLE_PLACES_API_KEY
  }
});

// Yelp API service
const yelpApi = axios.create({
  baseURL: 'https://api.yelp.com/v3',
  headers: {
    'Authorization': `Bearer ${process.env.YELP_API_KEY}`
  }
});

// Get restaurants near a location
export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 1500, type = 'restaurant' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Search for restaurants using Google Places API
    const response = await googlePlacesApi.get('/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        type: type,
        keyword: 'restaurant'
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      return res.status(500).json({ error: 'Failed to fetch restaurants' });
    }

    const restaurants = response.data.results || [];

    // Enhance with additional details from Yelp if available
    const enhancedRestaurants = await Promise.all(
      restaurants.map(async (restaurant: any) => {
        try {
          // Try to get Yelp details
          const yelpResponse = await yelpApi.get('/businesses/search', {
            params: {
              term: restaurant.name,
              latitude: restaurant.geometry.location.lat,
              longitude: restaurant.geometry.location.lng,
              radius: 100,
              limit: 1
            }
          });

          const yelpBusiness = yelpResponse.data.businesses[0];
          
          return {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating || yelpBusiness?.rating,
            totalRatings: restaurant.user_ratings_total || yelpBusiness?.review_count,
            priceLevel: restaurant.price_level || yelpBusiness?.price,
            types: restaurant.types,
            photos: restaurant.photos?.slice(0, 3).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
            ) || [],
            openingHours: restaurant.opening_hours?.open_now,
            yelpUrl: yelpBusiness?.url,
            phone: yelpBusiness?.phone,
            categories: yelpBusiness?.categories?.map((cat: any) => cat.title) || []
          };
        } catch (error) {
          // Return basic Google Places data if Yelp fails
          return {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating,
            totalRatings: restaurant.user_ratings_total,
            priceLevel: restaurant.price_level,
            types: restaurant.types,
            photos: restaurant.photos?.slice(0, 3).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
            ) || [],
            openingHours: restaurant.opening_hours?.open_now
          };
        }
      })
    );

    return res.json({
      success: true,
      restaurants: enhancedRestaurants,
      count: enhancedRestaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

// Search restaurants with filters
export const searchRestaurants = async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      lat, 
      lng, 
      radius = 1500, 
      minRating, 
      maxPrice, 
      openNow,
      cuisine 
    } = req.query;

    if (!query && !lat) {
      return res.status(400).json({ error: 'Query or location is required' });
    }

    let searchParams: any = {
      type: 'restaurant'
    };

    if (query) {
      searchParams.keyword = query;
    }

    if (lat && lng) {
      searchParams.location = `${lat},${lng}`;
      searchParams.radius = radius;
    }

    if (openNow === 'true') {
      searchParams.opennow = true;
    }

    // Search using Google Places API
    const response = await googlePlacesApi.get('/nearbysearch/json', {
      params: searchParams
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      return res.status(500).json({ error: 'Failed to search restaurants' });
    }

    let restaurants = response.data.results || [];

    // Apply filters
    if (minRating) {
      restaurants = restaurants.filter((restaurant: any) => 
        restaurant.rating >= parseFloat(minRating as string)
      );
    }

    if (maxPrice) {
      restaurants = restaurants.filter((restaurant: any) => 
        restaurant.price_level <= parseInt(maxPrice as string)
      );
    }

    if (cuisine) {
      restaurants = restaurants.filter((restaurant: any) => 
        restaurant.types.some((type: string) => 
          type.toLowerCase().includes(cuisine.toString().toLowerCase())
        )
      );
    }

    // Enhance with Yelp data
    const enhancedRestaurants = await Promise.all(
      restaurants.map(async (restaurant: any) => {
        try {
          const yelpResponse = await yelpApi.get('/businesses/search', {
            params: {
              term: restaurant.name,
              latitude: restaurant.geometry.location.lat,
              longitude: restaurant.geometry.location.lng,
              radius: 100,
              limit: 1
            }
          });

          const yelpBusiness = yelpResponse.data.businesses[0];
          
          return {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating || yelpBusiness?.rating,
            totalRatings: restaurant.user_ratings_total || yelpBusiness?.review_count,
            priceLevel: restaurant.price_level || yelpBusiness?.price,
            types: restaurant.types,
            photos: restaurant.photos?.slice(0, 3).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
            ) || [],
            openingHours: restaurant.opening_hours?.open_now,
            yelpUrl: yelpBusiness?.url,
            phone: yelpBusiness?.phone,
            categories: yelpBusiness?.categories?.map((cat: any) => cat.title) || []
          };
        } catch (error) {
          return {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating,
            totalRatings: restaurant.user_ratings_total,
            priceLevel: restaurant.price_level,
            types: restaurant.types,
            photos: restaurant.photos?.slice(0, 3).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
            ) || [],
            openingHours: restaurant.opening_hours?.open_now
          };
        }
      })
    );

    return res.json({
      success: true,
      restaurants: enhancedRestaurants,
      count: enhancedRestaurants.length
    });
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return res.status(500).json({ error: 'Failed to search restaurants' });
  }
};

// Get detailed information about a specific restaurant
export const getRestaurantDetails = async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    // Get detailed information from Google Places API
    const response = await googlePlacesApi.get('/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,formatted_phone_number,website,reviews'
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const place = response.data.result;

    // Try to get additional details from Yelp
    let yelpDetails = null;
    try {
      const yelpResponse = await yelpApi.get('/businesses/search', {
        params: {
          term: place.name,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          radius: 100,
          limit: 1
        }
      });

      if (yelpResponse.data.businesses.length > 0) {
        const yelpBusiness = yelpResponse.data.businesses[0];
        yelpDetails = {
          url: yelpBusiness.url,
          phone: yelpBusiness.phone,
          categories: yelpBusiness.categories,
          price: yelpBusiness.price,
          reviewCount: yelpBusiness.review_count,
          rating: yelpBusiness.rating,
          hours: yelpBusiness.hours
        };
      }
    } catch (error) {
      console.log('Yelp details not available for this restaurant');
    }

    const restaurantDetails = {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry.location,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      phone: place.formatted_phone_number,
      website: place.website,
      openingHours: place.opening_hours,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      ) || [],
      reviews: place.reviews?.slice(0, 5) || [],
      yelp: yelpDetails
    };

    return res.json({
      success: true,
      restaurant: restaurantDetails
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
}; 