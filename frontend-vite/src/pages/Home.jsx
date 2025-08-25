import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Unknown");
  const [isLoading, setIsLoading] = useState(true);

  // Logout function
  const handleLogout = () => {
    console.log("Logout initiated");
    console.log("Removing token from localStorage");
    localStorage.removeItem("token");
    console.log("Token removed successfully");
    
    // Dispatch event to notify App.jsx of auth change
    console.log("Dispatching authChange event");
    window.dispatchEvent(new Event('authChange'));
    console.log("AuthChange event dispatched");
    
    console.log("Navigating to /login");
    navigate("/login");
    console.log("Navigation to /login completed");
  };

  // Check authentication and decode token in useEffect
  useEffect(() => {
    console.log("Home component mounted, checking authentication...");
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No token found in localStorage");
      console.log("Redirecting to /login");
      navigate("/login");
      return;
    }

    console.log("Token found:", token.substring(0, 20) + "...");

    try {
      const decoded = jwtDecode(token);
      console.log("Token decoded successfully:", decoded);
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        console.log("Token expired at:", new Date(decoded.exp * 1000));
        console.log("Auto-logout due to expired token");
        handleLogout();
        return;
      }

      console.log("Token is valid, expires at:", new Date(decoded.exp * 1000));
      // Token is valid, set username
      setUsername(decoded.username || "Unknown");
      console.log("Username set to:", decoded.username || "Unknown");
      setIsLoading(false);
      console.log("Home component ready");
      
    } catch (err) {
      console.error("Token decode error:", err);
      console.log("Auto-logout due to invalid token");
      handleLogout();
    }
  }, [navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="p-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {username}!</h1>
      <p>You are now logged in.</p>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}