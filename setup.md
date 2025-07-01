# 🚀 Setup Guide

## Environment Variables

### Server (.env file in server/ directory)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Yelp Fusion API
YELP_API_KEY=your_yelp_fusion_api_key_here

# Eventbrite API
EVENTBRITE_API_KEY=your_eventbrite_api_key_here
```

### Client (.env file in client/ directory)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## API Setup Instructions

### 1. Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Create credentials (API key)
5. Add restrictions for security (HTTP referrers, IP addresses)

### 2. Yelp Fusion API
1. Go to [Yelp Developers](https://www.yelp.com/developers)
2. Create a new app
3. Get your API key
4. Note: Yelp API has rate limits (500 requests per day for free tier)

### 3. Eventbrite API
1. Go to [Eventbrite Platform](https://www.eventbrite.com/platform/api-keys)
2. Create a new app
3. Get your API key

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Copy the example environment variables above
   - Create `.env` files in both `server/` and `client/` directories
   - Add your API keys

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## Features Implemented

### ✅ Completed
- Full-stack project structure
- Authentication system (login/register)
- Location services with geolocation
- API integration setup
- Modern UI with Tailwind CSS
- Responsive design
- TypeScript support
- Error handling
- Loading states
- Form validation

### 🚧 In Progress / Next Steps
- Restaurant search and filtering
- Event search and filtering
- Google Maps integration
- Restaurant/Event detail pages
- User reviews and ratings
- Favorites system
- Advanced filtering options
- Real-time data updates

## Project Structure

```
rest-recommender/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── public/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── database/      # Database setup
│   └── database/          # SQLite database files
└── docs/                  # Documentation
```

## Development Commands

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
npm run build
```

## Next Steps for Enhancement

1. **Implement Restaurant Search:**
   - Add search filters (cuisine, price, rating)
   - Integrate Google Places API
   - Add restaurant cards with photos

2. **Implement Event Search:**
   - Add date and category filters
   - Integrate Eventbrite API
   - Add event cards with details

3. **Add Maps Integration:**
   - Google Maps component
   - Location markers
   - Directions and navigation

4. **User Features:**
   - Review system
   - Favorites management
   - User profiles
   - Activity history

5. **Advanced Features:**
   - Real-time updates
   - Push notifications
   - Social sharing
   - Recommendations engine 