import { useNavigate, useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../utils/axios";


const allNavItems = [
  { label: "Dashboard", path: "dashboard", icon: "/Sidebar/icon/layout.svg" },
  { label: "Assignments", path: "assignments", icon: "/Sidebar/icon/clipboard-signature.svg" },
  { label: "Markers", path: "markers", icon: "/Sidebar/icon/users.svg" },
  { label: "Reports / Exports", path: "reports", icon: "/Sidebar/icon/file-output.svg" },
  { label: "Settings", path: "settings", icon: "/Sidebar/icon/settings.svg" },
];

export default function Sidebar({ activeTab = 0 }) {
  const [activeIndex, setActiveIndex] = useState(activeTab);
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState(null);

  // Helper function to get cached role
  const getCachedRole = (teamId) => {
    if (!teamId) return null;
    try {
      const cached = localStorage.getItem(`userRole_${teamId}`);
      if (cached) {
        const { role, timestamp } = JSON.parse(cached);
        // Cache is valid for 5 minutes
        const cacheAge = Date.now() - timestamp;
        if (cacheAge < 5 * 60 * 1000) {
          return role;
        }
      }
    } catch (error) {
      console.error("Error reading cached role:", error);
    }
    return null;
  };

  // Initialize navItems - will be updated immediately if cache exists
  const [navItems, setNavItems] = useState(allNavItems.filter(item => item.path !== "reports"));

  // Helper function to cache role
  const cacheRole = (teamId, role) => {
    try {
      localStorage.setItem(`userRole_${teamId}`, JSON.stringify({
        role,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching role:", error);
    }
  };

  // Helper function to update nav items based on role
  const updateNavItems = (role) => {
    if (role === "admin") {
      setNavItems(allNavItems);
    } else {
      setNavItems(allNavItems.filter(item => item.path !== "reports"));
    }
  };

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !teamId) {
        console.log("No token or teamId available");
        return;
      }

      // Check cache first for immediate UI update
      const cachedRole = getCachedRole(teamId);
      if (cachedRole) {
        setUserRole(cachedRole);
        updateNavItems(cachedRole);
      }

      // Fetch from API to get fresh data
      try {
        const res = await api.get(`/team/${teamId}/role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const role = res.data.role;
        console.log("Fetched user role:", role);
        setUserRole(role);
        cacheRole(teamId, role);
        updateNavItems(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
        // If fetch fails but we have cached role, keep using it
        if (!cachedRole) {
          // Only clear nav items if we don't have a cached role
          setNavItems(allNavItems.filter(item => item.path !== "reports"));
        }
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    }
  };

  const handleNav = (i, path) => {
    setActiveIndex(i);
    navigate(`/team/${teamId}/${path}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear all cached roles
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("userRole_")) {
        localStorage.removeItem(key);
      }
    });
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const handleClickLogo = () => {
    navigate(`/team/${teamId}/dashboard`);
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsername(user.username);
    }
  }, []);

  useEffect(() => {
    setActiveIndex(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (teamId) {
      // Check cache immediately for instant UI update
      const cachedRole = getCachedRole(teamId);
      if (cachedRole) {
        setUserRole(cachedRole);
        updateNavItems(cachedRole);
      }
      // Then fetch fresh data
      fetchUserRole();
    }
  }, [teamId]);

  return (
    <div className="min-h-full bg-[#201f30] flex flex-col p-4 font-['Inter'] w-full">
      {/* Logo / Title */}
      <div
        className="flex gap-2 mb-6 justify-start cursor-pointer hover:opacity-80 transition"
        onClick={handleClickLogo} // <-- ADDED: go to dashboard when click on logo
        title="Return to Homepage" // <-- ADDED: Tooltip for better user experience
      >
        <div className="relative h-11 pl-1 flex justify-start">
          <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-[2spx] justify-start">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleNav(i, item.path)}
            className={`flex items-center gap-[6px] px-3 py-3 rounded-lg transition cursor-pointer
              ${activeIndex === i ? "bg-[var(--deakinTeal)]" : ""}
              ${activeIndex !== i ? "hover:bg-[#434343]" : ""} justify-start`}
          >
            {/* Icon */}
            <div className="w-4 h-4 relative overflow-hidden">
              <img
                src={item.icon}
                alt={`${item.label} icon`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Label */}
            <span className="justify-start text-[#F7F7F7] text-md font-base font-['Inter'] leading-7">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}