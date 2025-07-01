import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
    setDropdownOpen(false); // close dropdown on route change
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Restaurants', path: '/restaurants' },
    { name: 'Events', path: '/events' },
  ];
  return (
    <nav className="bg-white shadow border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
            <span role="img" aria-label="pin" className="text-white text-lg">📍</span>
          </div>
          <span className="text-xl font-bold gradient-text">LocalGuide</span>
        </Link>
        {/* Nav Links */}
        <div className="flex space-x-8">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${location.pathname === link.path ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        {/* Auth/User */}
        <div className="flex items-center space-x-4 min-w-[180px] justify-end">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center px-4 py-2 bg-gray-100 rounded-full shadow-sm border border-gray-200 font-semibold text-black text-base hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                Welcome, {user.name.split(' ')[0]}
                <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      setDropdownOpen(false);
                      window.location.href = '/';
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar; 