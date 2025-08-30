import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgetpassword from "./pages/Forgetpassword";
import CreateTeam from "./pages/CreateTeam";
import TeamDashboard from "./pages/TeamDashboard";
import { jwtDecode } from "jwt-decode";
import Navbar from "./components/Navbar";

/////////////////////////////////////////////////////////////////
//  App component
//  ------------------------
//  This is the root component of the application. It handles:
//  - Authentication of JWT on startup
//  - Route protection and conditional redirects based on login state
//  - Rendering the appropriate page components
//////////////////////////////////////////////////////////////////

function App() {

  // Tracks whether the user is currently logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Tracks whether auth status is being evaluated (for initial page load)
  const [isLoading, setIsLoading] = useState(true);

  ////////////////////////////////////////////////////////////////////////////////
  //  getAuthStatus
  //  ------------------------
  //  - Checks if a valid JWT exists in localStorage for the user.
  //  - Returns `true` if the user is authenticated, `false` otherwise.
  //  - Performs expiration validation and removes expired/invalid tokens.
  ////////////////////////////////////////////////////////////////////////////////

  const getAuthStatus = () => {
    const token = localStorage.getItem("token");

    // No token => user not authenticated
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);

      // Verify that token has an expiration field
      if (!decoded.exp) {
        console.warn("Token does not have expiration field");
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 60; // Small buffer to account for clock differences

      if (decoded.exp < (now + bufferTime)) {
        console.log("Token expired, removing from storage");
        localStorage.removeItem("token");
        return false;
      }

      // Token is valid
      return true;
    } catch (error) {
      // Invalid or broken token
      console.error("Invalid token:", error.message);
      localStorage.removeItem("token");
      return false;
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //  useEffect hook
  //  ------------------------
  //  Checks authentication status on startup and monitors across multiple tabs and reloads
  //  Functionality:
  //  - Syncronises logins across multiple tabs
  //  - Checks if we were previously logged in on startup
  //  - Removes other tab listeners on unmount
  /////////////////////////////////////////////////////////////////////////////////////////////////
  
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = getAuthStatus();
      setIsLoggedIn(authStatus);
      setIsLoading(false);
    };

    // Initial check on mount
    checkAuth();

    // Handler for storage changes (other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    // custom event for same-tab login/logout
    window.addEventListener('authChange', handleStorageChange);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  // Show a simple loading screen while authentication status is being evaluated
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

  //////////////////////////////////////////////////////////////////////////////////
  //  Router
  //  ------------------------
  //  Redirects away from the login pages if we hafe a valid login token already
  //////////////////////////////////////////////////////////////////////////////////

  return (
    <Router>
      <ConditionalNavbarWrapper>
        <Routes>
          {/* Root route: redirect to home if logged in, otherwise login */}
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/team/1" replace /> : <Navigate to="/login" replace />}
          />

          {/* Public routes */}
          <Route
            path="/login"
            element={!isLoggedIn ? <Login /> : <Navigate to="/team/1" replace />}
          />
          <Route
            path="/signup"
            element={!isLoggedIn ? <Signup /> : <Navigate to="/team/1" replace />}
          />
          <Route
            path="/forgetpassword"
            element={!isLoggedIn ? <Forgetpassword /> : <Navigate to="/team/1" replace />}
          />
          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team/:teamId" element={<TeamDashboard />} />
        </Routes>
      </ConditionalNavbarWrapper>
    </Router>
  );
}

function ConditionalNavbarWrapper({ children }) {
  const location = useLocation();

  // Show Navbar only on team dashboard pages
  const isTeamDashboard = location.pathname.startsWith("/team/");

  return (
    <div>
      {isTeamDashboard && <Navbar />}
      <div className="content">{children}</div>
    </div>
  );
}

export default App;
