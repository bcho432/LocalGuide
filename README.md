# 🍽️ Local Events & Restaurant Recommender

A modern web application that recommends restaurants and local events based on your location, preferences, and current time. Built with React, Node.js, and integrated with multiple APIs.

## ✨ Features

- **Location-based Recommendations**: Get personalized suggestions based on your current location
- **Restaurant Discovery**: Find restaurants with ratings, reviews, and cuisine types
- **Event Discovery**: Discover local events, concerts, and activities
- **Interactive Maps**: Visualize locations with Google Maps integration
- **User Reviews**: Leave ratings and reviews for places you visit
- **Advanced Filtering**: Filter by cuisine, price range, distance, and more
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Query for state management

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- JWT authentication
- Rate limiting and CORS

### APIs
- Google Places API (restaurants)
- Yelp Fusion API (restaurant details)
- Eventbrite API (events)
- Google Maps JavaScript API

## 🚀 Quick Start

### Option 1: Use the provided script (Recommended)
```bash
# Make the script executable (if not already done)
chmod +x run-app.sh

# Run the application
./run-app.sh
```

### Option 2: Manual startup
```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend server
cd client
npm start
```

## 📋 Prerequisites

Before running the application, make sure you have:

1. **Node.js** (v14 or higher)
2. **npm** or **yarn**
3. **API Keys** for the following services:
   - Google Places API
   - Yelp Fusion API
   - Eventbrite API

## 🔧 Environment Setup

### Backend Environment Variables
Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
DATABASE_PATH=./data/rest_recommender.db

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# API Keys
GOOGLE_PLACES_API_KEY=your_google_places_api_key
YELP_API_KEY=your_yelp_api_key
EVENTBRITE_API_KEY=your_eventbrite_api_key
```

### Frontend Environment Variables
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🏗️ Project Structure

```
rest_recommender/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   └── package.json
├── run-app.sh             # Startup script
└── README.md
```

## 🌐 Available Endpoints

### Backend API (Port 5001)
- `GET /api/restaurants` - Get restaurants near a location
- `GET /api/restaurants/search` - Search restaurants with filters
- `GET /api/restaurants/:placeId` - Get restaurant details
- `GET /api/events` - Get events near a location
- `GET /api/events/search` - Search events with filters
- `GET /api/events/:eventId` - Get event details
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Frontend (Port 3000)
- `/` - Home page
- `/restaurants` - Restaurant search and listing
- `/events` - Event search and listing
- `/login` - User login
- `/register` - User registration
- `/profile` - User profile (protected)

## 🔍 Features

- **Restaurant Discovery**: Find restaurants using Google Places API with Yelp integration
- **Event Discovery**: Find local events using Eventbrite API
- **User Authentication**: JWT-based authentication system
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Real-time Search**: Search with filters and location-based results

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes using ports 3000 and 5001
   pkill -f "node.*3000"
   pkill -f "node.*5001"
   ```

2. **Database errors**
   ```bash
   # Ensure the data directory exists
   mkdir -p server/data
   ```

3. **API key errors**
   - Verify all API keys are correctly set in `.env` files
   - Check API key permissions and quotas

4. **CORS errors**
   - Ensure the backend is running on port 5001
   - Check that the frontend is making requests to the correct URL

### Getting API Keys

1. **Google Places API**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Yelp Fusion API**: [Yelp Developers](https://www.yelp.com/developers)
3. **Eventbrite API**: [Eventbrite Developers](https://www.eventbrite.com/platform/api-keys)

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Places API for restaurant data
- Yelp Fusion API for detailed restaurant information
- Eventbrite API for event data
- React and Node.js communities for excellent documentation