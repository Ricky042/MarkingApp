import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Forgetpassword from "./pages/Forgetpassword.jsx";
import { jwtDecode } from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthStatus = () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      
      // Check if token has expiration field
      if (!decoded.exp) {
        console.warn("Token does not have expiration field");
        return false;
      }

      // Check if token is expired (add small buffer for clock skew)
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 60; // 60 seconds buffer
      
      if (decoded.exp < (now + bufferTime)) {
        console.log("Token expired, removing from storage");
        localStorage.removeItem("token");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invalid token:", error.message);
      localStorage.removeItem("token");
      return false;
    }
  };

  // Check auth status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = getAuthStatus();
      setIsLoggedIn(authStatus);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab localStorage changes
    window.addEventListener('authChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Redirect root based on login state */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />}
        />

        {/* Main routes */}
        <Route
          path="/login"
          element={!isLoggedIn ? <Login /> : <Navigate to="/home" replace />}
        />
        <Route
          path="/signup"
          element={!isLoggedIn ? <Signup /> : <Navigate to="/home" replace />}
        />
        <Route
          path="/home"
          element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/forgetpassword"
          element={!isLoggedIn ? <Forgetpassword /> : <Navigate to="/home" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;