import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import Events from './pages/Events';
import Hotels from './pages/Hotels';
import Saved from './pages/Saved';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import HotelDetailPage from './pages/HotelDetailPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:place_id" element={<HotelDetailPage />} />
          <Route path="/saved" element={
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 