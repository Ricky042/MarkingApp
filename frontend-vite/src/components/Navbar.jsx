import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/axios";

/**
 * Responsive NavBar
 * - Matches your provided layout on desktop (avatar initials "CE", name, hamburger icon, search pill)
 * - Collapses on mobile with a Menu button that toggles a slide-down panel
 * - Accessible (aria-labels, roles, focus rings, ESC to close menu)
 * - TailwindCSS only; no external UI libs required
 */
export default function NavBar({onBurgerClick}) {
    const [username, setUsername] = useState("");
    const [menuOpen, setMenuOpen] = useState(false); // navbar menu state
    const [userRole, setUserRole] = useState(null);
    const { teamId } = useParams();

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
      } catch (error) {
        console.error("Error fetching user role:", error);
        // If fetch fails but we have cached role, keep using it
        // cachedRole is already checked above and set to state if exists
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    }
  };

  // Close menu on ESC
    useEffect(() => {
        const onKey = (e) => {
        if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []
    );
 
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log(user.username);
            console.log(user.id);
            setUsername(user.username);
        }
    }, []);

    useEffect(() => {
      if (teamId) {
        // Check cache immediately for instant UI update
        const cachedRole = getCachedRole(teamId);
        if (cachedRole) {
          setUserRole(cachedRole);
        }
        // Then fetch fresh data
        fetchUserRole();
      }
    }, [teamId]);

    // Format role for display
    const formatRole = (role) => {
      if (!role) return null;
      return role.charAt(0).toUpperCase() + role.slice(1);
    };

    return (
        <header className="w-full bg-white/90 backdrop-blur border-b border-slate-200">
        {/* Top bar */}
        <div className="px-6">
            <div className="h-16 flex items-center">
            {/* Menu Button */}
            <div className="flex-shrink-0 flex items-center gap-6">
                <div className="relative w-8 h-8 shrink-0">
                    {/*<div className="absolute inset-0 rounded-full bg-slate-200" />*/}
                    <img
                        src="/navBarIcon/navBar_Ellipse 1.svg"
                        alt="User Avatar"
                        className="h-8 w-8"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-900 text-[10px] leading-none font-normal font-['Inter'] tracking-wide select-none">
                            {username ? username.charAt(0).toUpperCase() : ""}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 text-sm font-semibold font-['Inter'] leading-normal">          
                      {username}
                  </span>
                  {userRole && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                      {formatRole(userRole)}
                    </span>
                  )}
                </div>
            </div>

            {/* Search */}
            <div className="flex max-w-72 ml-auto mr-6">
                <div className="w-full min-h-8 px-3 py-1.5 bg-neutral-100 rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                <img
                    src="/navBarIcon/navBar_searchIcon.svg"
                    alt="Menu Icon"
                    className="h-3 w-3"
                />
                <input
                    className="bg-transparent outline-none placeholder-zinc-500 text-sm w-full"
                    placeholder="Search"
                    aria-label="Search"
                />
                </div>
            </div>
            </div>
        </div>
        </header>
    );
}
