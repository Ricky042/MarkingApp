import { useNavigate, useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";


const allNavItems = [
  { label: "Dashboard", path: "dashboard", icon: "/Sidebar/icon/layout.svg" },
  { label: "Assignments", path: "assignments", icon: "/Sidebar/icon/clipboard-signature.svg" },
  { label: "Markers", path: "markers", icon: "/Sidebar/icon/users.svg" },
  { label: "Flags", path: "flags", icon: "/Sidebar/icon/flag.svg" },
  { label: "Reports / Exports", path: "reports", icon: "/Sidebar/icon/file-output.svg" },
  { label: "Settings", path: "settings", icon: "/Sidebar/icon/settings.svg" },
];

export default function Sidebar({ activeTab = 0 }) {
  const [activeIndex, setActiveIndex] = useState(activeTab);
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [navItems, setNavItems] = useState(allNavItems.filter(item => item.path !== "reports")); // 默认不显示reports


  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !teamId) {
        console.log("No token or teamId available");
        return;
      }


      let response;
      try {
        response = await fetch(`/api/team/${teamId}/role`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (networkError) {
        console.error("Network error:", networkError);

        try {
          response = await fetch(`/team/${teamId}/role`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (fallbackError) {
          console.error("Fallback request also failed:", fallbackError);
          return;
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        console.log("Response status:", response.status);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched user role:", data.role);
        setUserRole(data.role);
        
        // Based on role, set navigation items
        if (data.role === "admin") {

          setNavItems(allNavItems);
        } else {

          setNavItems(allNavItems.filter(item => item.path !== "reports"));
        }
      } else {
        console.error("Failed to fetch user role, status:", response.status);

      }
    } catch (error) {
      console.error("Error fetching user role:", error);

    }
  };

  const handleNav = (i, path) => {
    setActiveIndex(i);
    navigate(`/team/${teamId}/${path}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
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
      console.log("Fetching role for team:", teamId);
      fetchUserRole();
    }
  }, [teamId]);

  return (
    <div className="min-h-full bg-[#201f30] flex flex-col p-4 font-['Inter'] w-full">
      {/* Logo / Title */}
      <div
        className="flex items-center gap-2 mb-6 justify-start cursor-pointer hover:opacity-80 transition"
        onClick={handleLogout}
        title="Logout"
      >
        <div className="relative w-7 h-7 flex items-center justify-center">
          <img
            src="/Sidebar/Ellipse 1.svg"
            alt="Profile Circle"
            className="w-6 h-6 bg-slate-200 rounded-full"
          />
          <span className="absolute text-[10px] text-slate-900 font-normal leading-none">
            {username ? username.charAt(0).toUpperCase() : ""}
          </span>
        </div>
        <span className="text-neutral-100 text-md font-bold font-['Inter'] leading-normal">
          Assignment
        </span>
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