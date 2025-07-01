import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationState {
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

type LocationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_PERMISSION'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

interface LocationContextType extends LocationState {
  getCurrentLocation: () => Promise<void>;
  setLocation: (location: Location) => void;
  clearError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const initialState: LocationState = {
  currentLocation: null,
  isLoading: false,
  error: null,
  hasPermission: false,
};

function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_LOCATION':
      return {
        ...state,
        currentLocation: action.payload,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_PERMISSION':
      return {
        ...state,
        hasPermission: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(locationReducer, initialState);

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return '';
    } catch (error) {
      console.error('Error getting address:', error);
      return '';
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_ERROR', payload: 'Geolocation is not supported by this browser' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      
      // Get address from coordinates
      const address = await getAddressFromCoords(lat, lng);
      
      const location: Location = {
        lat,
        lng,
        address,
      };

      dispatch({ type: 'SET_LOCATION', payload: location });
      dispatch({ type: 'SET_PERMISSION', payload: true });
      
      // Save to localStorage
      localStorage.setItem('lastLocation', JSON.stringify(location));
      
      toast.success('Location updated successfully');
    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access.';
          dispatch({ type: 'SET_PERMISSION', payload: false });
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
        default:
          errorMessage = error.message || 'An unknown error occurred.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setLocation = (location: Location) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
    localStorage.setItem('lastLocation', JSON.stringify(location));
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load last known location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('lastLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        dispatch({ type: 'SET_LOCATION', payload: location });
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
  }, []);

  // Check geolocation permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        dispatch({ type: 'SET_PERMISSION', payload: result.state === 'granted' });
        
        result.addEventListener('change', () => {
          dispatch({ type: 'SET_PERMISSION', payload: result.state === 'granted' });
        });
      });
    }
  }, []);

  const value: LocationContextType = {
    ...state,
    getCurrentLocation,
    setLocation,
    clearError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 