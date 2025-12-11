import React, { useState, useEffect } from 'react';

const PasswordProtect = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if already authenticated on mount
  useEffect(() => {
    // Skip password on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsAuthenticated(true);
      return;
    }
    
    const stored = localStorage.getItem('gfl_authenticated');
    if (stored) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Change this password to something secure
    const correctPassword = 'gflprivatetest123';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('gfl_authenticated', 'true');
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gfl_authenticated');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-2 text-green-700">
            Garden For Life
          </h1>
          <p className="text-center text-gray-600 mb-6">
            This site is currently private. Please enter the password to continue.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Access Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-lg z-50 transition-colors duration-200"
        title="Logout"
      >
        Logout
      </button>
      {children}
    </>
  );
};

export default PasswordProtect;
