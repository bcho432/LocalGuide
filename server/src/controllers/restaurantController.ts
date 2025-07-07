import { Request, Response } from 'express';
import axios from 'axios';

// Yelp API service - create without auth header to avoid undefined issues
const yelpApi = axios.create({
  baseURL: 'https://api.yelp.com/v3'
});

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Get restaurants near a location
export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 1500, type = 'restaurant' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    console.log(`🔍 Fetching restaurants near ${lat},${lng} with radius ${radius}m`);

    // Search for restaurants using Google Places API
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Places API key not found in environment variables');
      return res.status(500).json({ 
        error: 'Google Places API key not configured',
        details: 'API key is missing from environment variables'
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        type: type,
        keyword: 'restaurant',
        key: apiKey
      }
    });

    console.log(`📊 Google Places API response status: ${response.data.status}`);

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error:', {
        status: response.data.status,
        error_message: response.data.error_message,
        request_params: { lat, lng, radius, type }
      });
      return res.status(500).json({ 
        error: 'Failed to fetch restaurants',
        details: response.data.error_message || response.data.status
      });
    }

    const restaurants = response.data.results || [];
    console.log(`✅ Found ${restaurants.length} restaurants from Google Places API`);

    // Calculate the maximum distance to any restaurant for Yelp search radius
    const maxDistance = Math.max(...restaurants.map((restaurant: any) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        restaurant.geometry.location.lat,
        restaurant.geometry.location.lng
      );
      return distance * 1000; // Convert to meters
    }));
    
    console.log(`📏 Maximum distance to any restaurant: ${Math.round(maxDistance)}m`);

    // Enhance with additional details from Yelp if available
    const enhancedRestaurants = [];
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      
      // Add delay between Yelp API calls to respect rate limits
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between requests
      }
        try {
          // Try to get Yelp details using the maximum distance as radius
          const yelpApiKey = process.env.YELP_API_KEY;
          if (!yelpApiKey) {
            console.error('❌ Yelp API key not found in environment variables');
            throw new Error('Yelp API key not configured');
          }

          console.log(`🔍 Making Yelp API call for: ${restaurant.name}`);
          const yelpResponse = await yelpApi.get('/businesses/search', {
            headers: {
              'Authorization': `Bearer ${yelpApiKey}`
            },
            params: {
              term: restaurant.name.split(' ')[0], // Use first word of restaurant name for broader search
              latitude: restaurant.geometry.location.lat,
              longitude: restaurant.geometry.location.lng,
              radius: Math.round(maxDistance),
              limit: 3
            }
          });

          const yelpBusiness = yelpResponse.data.businesses[0];
          if (yelpBusiness) {
            console.log(`✅ Yelp data found for: ${restaurant.name} (rating: ${yelpBusiness.rating}, reviews: ${yelpBusiness.review_count})`);
          } else {
            console.log(`⚠️ No Yelp data found for: ${restaurant.name}`);
          }
          
          const enhancedRestaurant = {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating || yelpBusiness?.rating,
            totalRatings: restaurant.user_ratings_total || yelpBusiness?.review_count,
            priceLevel: restaurant.price_level || yelpBusiness?.price,
            types: restaurant.types,
            photos: (() => {
              if (!restaurant.photos || restaurant.photos.length === 0) {
                console.log(`📸 No photos available for: ${restaurant.name}`);
                return [];
              }
              console.log(`📸 Found ${restaurant.photos.length} photos for: ${restaurant.name}`);
              return restaurant.photos.slice(0, 3).map((photo: any) => {
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
                return photoUrl;
              });
            })(),
            openingHours: restaurant.opening_hours?.open_now,
            yelpUrl: yelpBusiness?.url,
            phone: yelpBusiness?.phone,
            categories: yelpBusiness?.categories?.map((cat: any) => cat.title) || []
          };
          enhancedRestaurants.push(enhancedRestaurant);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Yelp API error details:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              url: error.config?.url,
              method: error.config?.method
            });
          } else {
            console.error('Yelp API error:', error);
          }
          // Return basic Google Places data if Yelp fails
          const enhancedRestaurant = {
            id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.vicinity,
            location: restaurant.geometry.location,
            rating: restaurant.rating,
            totalRatings: restaurant.user_ratings_total,
            priceLevel: restaurant.price_level,
            types: restaurant.types,
            photos: (() => {
              if (!restaurant.photos || restaurant.photos.length === 0) {
                console.log(`📸 No photos available for: ${restaurant.name}`);
                return [];
              }
              console.log(`📸 Found ${restaurant.photos.length} photos for: ${restaurant.name}`);
              return restaurant.photos.slice(0, 3).map((photo: any) => {
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
                return photoUrl;
              });
            })(),
            openingHours: restaurant.opening_hours?.open_now
          };
          enhancedRestaurants.push(enhancedRestaurant);
        }
      }

    // Calculate distances and add to restaurant objects (if location is provided)
    let restaurantsWithDistance: any[] = enhancedRestaurants;
    if (lat && lng && userLat !== null && userLng !== null) {
      restaurantsWithDistance = enhancedRestaurants.map(restaurant => {
        const distance = calculateDistance(
          userLat,
          userLng,
          restaurant.location.lat,
          restaurant.location.lng
        );
        return {
          ...restaurant,
          distance: Math.round(distance * 1000)
        };
      });

      // Sort restaurants by distance (closest first)
      restaurantsWithDistance.sort((a, b) => a.distance - b.distance);
    }

    console.log(`🎉 Successfully enhanced and sorted ${restaurantsWithDistance.length} restaurants by distance`);

    return res.json({
      success: true,
      restaurants: restaurantsWithDistance,
      count: restaurantsWithDistance.length
    });
  } catch (error) {
    console.error('💥 Error fetching restaurants:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      request_params: req.query
    });
    
    // Check if it's an Axios error for more detailed logging
    if (axios.isAxiosError(error)) {
      console.error('🌐 Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch restaurants',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Places API key not found in environment variables');
      return res.status(500).json({ 
        error: 'Google Places API key not configured',
        details: 'API key is missing from environment variables'
      });
    }

    // Parse user coordinates if provided
    const userLat = lat ? parseFloat(lat as string) : null;
    const userLng = lng ? parseFloat(lng as string) : null;

    let searchParams: any = {
      type: 'restaurant',
      key: apiKey
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
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: searchParams
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error in search:', {
        status: response.data.status,
        error_message: response.data.error_message,
        request_params: searchParams
      });
      return res.status(500).json({ 
        error: 'Failed to search restaurants',
        details: response.data.error_message || response.data.status
      });
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

    // Calculate the maximum distance to any restaurant for Yelp search radius (if location provided)
    let maxDistance = 1000; // Default fallback
    if (lat && lng && userLat !== null && userLng !== null) {
      maxDistance = Math.max(...restaurants.map((restaurant: any) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          restaurant.geometry.location.lat,
          restaurant.geometry.location.lng
        );
        return distance * 1000; // Convert to meters
      }));
      
      console.log(`📏 Maximum distance to any restaurant in search: ${Math.round(maxDistance)}m`);
    }

    // Enhance with Yelp data
    const enhancedRestaurants = [];
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      }
      try {
        const yelpApiKey = process.env.YELP_API_KEY;
        if (!yelpApiKey) {
          console.error('❌ Yelp API key not found in environment variables');
          throw new Error('Yelp API key not configured');
        }
        const yelpResponse = await yelpApi.get('/businesses/search', {
          headers: {
            'Authorization': `Bearer ${yelpApiKey}`
          },
          params: {
            term: restaurant.name.split(' ')[0],
            latitude: restaurant.geometry.location.lat,
            longitude: restaurant.geometry.location.lng,
            radius: Math.round(maxDistance),
            limit: 3
          }
        });
        const yelpBusiness = yelpResponse.data.businesses[0];
        const enhancedRestaurant = {
          id: restaurant.place_id,
          name: restaurant.name,
          address: restaurant.vicinity,
          location: restaurant.geometry.location,
          rating: restaurant.rating || yelpBusiness?.rating,
          totalRatings: restaurant.user_ratings_total || yelpBusiness?.review_count,
          priceLevel: restaurant.price_level || yelpBusiness?.price,
          types: restaurant.types,
          photos: (() => {
            if (!restaurant.photos || restaurant.photos.length === 0) {
              console.log(`📸 No photos available for: ${restaurant.name}`);
              return [];
            }
            console.log(`📸 Found ${restaurant.photos.length} photos for: ${restaurant.name}`);
            return restaurant.photos.slice(0, 3).map((photo: any) => {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
              return photoUrl;
            });
          })(),
          openingHours: restaurant.opening_hours?.open_now,
          yelpUrl: yelpBusiness?.url,
          phone: yelpBusiness?.phone,
          categories: yelpBusiness?.categories?.map((cat: any) => cat.title) || []
        };
        enhancedRestaurants.push(enhancedRestaurant);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Yelp API error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
          });
        } else {
          console.error('Yelp API error:', error);
        }
        const enhancedRestaurant = {
          id: restaurant.place_id,
          name: restaurant.name,
          address: restaurant.vicinity,
          location: restaurant.geometry.location,
          rating: restaurant.rating,
          totalRatings: restaurant.user_ratings_total,
          priceLevel: restaurant.price_level,
          types: restaurant.types,
          photos: (() => {
            if (!restaurant.photos || restaurant.photos.length === 0) {
              console.log(`📸 No photos available for: ${restaurant.name}`);
              return [];
            }
            console.log(`📸 Found ${restaurant.photos.length} photos for: ${restaurant.name}`);
            return restaurant.photos.slice(0, 3).map((photo: any) => {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
              return photoUrl;
            });
          })(),
          openingHours: restaurant.opening_hours?.open_now
        };
        enhancedRestaurants.push(enhancedRestaurant);
      }
    }

    // Calculate distances and add to restaurant objects (if location is provided)
    let restaurantsWithDistance: any[] = enhancedRestaurants;
    if (lat && lng && userLat !== null && userLng !== null) {
      restaurantsWithDistance = enhancedRestaurants.map(restaurant => {
        const distance = calculateDistance(
          userLat,
          userLng,
          restaurant.location.lat,
          restaurant.location.lng
        );
        return {
          ...restaurant,
          distance: Math.round(distance * 1000)
        };
      });

      // Sort restaurants by distance (closest first)
      restaurantsWithDistance.sort((a, b) => a.distance - b.distance);
    }

    return res.json({
      success: true,
      restaurants: restaurantsWithDistance,
      count: restaurantsWithDistance.length
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

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Places API key not found in environment variables');
      return res.status(500).json({ 
        error: 'Google Places API key not configured',
        details: 'API key is missing from environment variables'
      });
    }

    // Get detailed information from Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,formatted_phone_number,website,reviews',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      console.error('❌ Google Places API error in details:', {
        status: response.data.status,
        error_message: response.data.error_message,
        place_id: placeId
      });
      return res.status(404).json({ 
        error: 'Restaurant not found',
        details: response.data.error_message || response.data.status
      });
    }

    const place = response.data.result;

    // Try to get additional details from Yelp
    let yelpDetails = null;
    try {
      const yelpApiKey = process.env.YELP_API_KEY;
      if (!yelpApiKey) {
        console.error('❌ Yelp API key not found in environment variables');
        throw new Error('Yelp API key not configured');
      }

      const yelpResponse = await yelpApi.get('/businesses/search', {
        headers: {
          'Authorization': `Bearer ${yelpApiKey}`
        },
        params: {
          term: place.name.split(' ')[0], // Use first word of restaurant name for broader search
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          radius: 5000, // Use 5km radius for restaurant details
          limit: 3
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
      if (axios.isAxiosError(error)) {
        console.error('Yelp API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        console.error('Yelp API error:', error);
      }
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
      openingHoursText: place.opening_hours?.weekday_text || [],
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`
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

// Get address suggestions for autocomplete
export const getAddressSuggestions = async (req: Request, res: Response) => {
  try {
    const { input } = req.query;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input parameter is required' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Places API key not found in environment variables');
      return res.status(500).json({ 
        error: 'Google Places API key not configured',
        details: 'API key is missing from environment variables'
      });
    }

    // Proxy the request to Google Places Autocomplete API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input: input,
        types: 'geocode',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      console.error('❌ Google Places Autocomplete API error:', {
        status: response.data.status,
        error_message: response.data.error_message,
        input: input
      });
      return res.status(500).json({ 
        error: 'Failed to fetch suggestions',
        details: response.data.error_message || response.data.status
      });
    }

    return res.json({
      success: true,
      predictions: response.data.predictions || []
    });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return res.status(500).json({ error: 'Failed to fetch address suggestions' });
  }
};

// Geocode address or place_id to coordinates
export const geocodeLocation = async (req: Request, res: Response) => {
  try {
    const { address, placeId } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    if (placeId) {
      // Use Places Details API for placeId
      const detailsRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          key: apiKey,
          fields: 'geometry'
        }
      });
      if (
        detailsRes.data.status !== 'OK' ||
        !detailsRes.data.result ||
        !detailsRes.data.result.geometry
      ) {
        return res.status(404).json({ error: 'Location not found' });
      }
      const { lat, lng } = detailsRes.data.result.geometry.location;
      return res.json({ lat, lng });
    } else if (address) {
      // Use Geocoding API for address
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address, key: apiKey }
      });
      if (response.data.status !== 'OK' || !response.data.results.length) {
        return res.status(404).json({ error: 'Location not found' });
      }
      const { lat, lng } = response.data.results[0].geometry.location;
      return res.json({ lat, lng });
    } else {
      return res.status(400).json({ error: 'address or placeId required' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to geocode location' });
  }
}; 