import { useNavigate, useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";

const navItems = [
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

  const handleNav = (i, path) => {
    setActiveIndex(i);
    navigate(`/team/${teamId}/${path}`);
  };

  const handleLogout = () => {
    // Clear user authentication data from storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Notify the app that authentication state has changed
    window.dispatchEvent(new Event("authChange"));

    // Navigate to the login page
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

  return (
    <div className="min-h-full bg-[#201f30] flex flex-col p-4 font-['Inter'] w-full">
      {/* Logo / Title */}
      <div
        className="flex items-center gap-2 mb-6 justify-start cursor-pointer hover:opacity-80 transition"
        onClick={handleLogout} // <-- ADDED: Logout functionality
        title="Logout" // <-- ADDED: Tooltip for better user experience
      >
        <div className="relative w-7 h-7 flex items-center justify-center">
          {/* Circle from public assets */}
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