#!/bin/bash

# Server environment file
cat > server/.env << EOF
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
EOF

# Client environment file
cat > client/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update the API keys in server/.env and client/.env when you get them"
echo "2. Run 'npm run dev' to start the development servers"
echo "3. Visit http://localhost:3000 to see the app"
echo ""
echo "🔑 API Setup Guide:"
echo "- Google Places API: https://console.cloud.google.com/"
echo "- Yelp Fusion API: https://www.yelp.com/developers"
echo "- Eventbrite API: https://www.eventbrite.com/platform/api-keys" 