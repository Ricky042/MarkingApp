// Sidebar.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "dashboard", icon: "/Sidebar/icon/layout.svg" },
  { label: "Assignments", path: "assignments", icon: "/Sidebar/icon/clipboard-signature.svg" },
  { label: "Markers", path: "markers", icon: "/Sidebar/icon/users.svg" },
  { label: "Flags", path: "flags", icon: "/Sidebar/icon/flag.svg" },
  { label: "Reports / Exports", path: "reports", icon: "/Sidebar/icon/file-output.svg" },
  { label: "Settings", path: "settings", icon: "/Sidebar/icon/settings.svg" },
];

export default function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { teamId } = useParams();

  const handleNav = (i, path) => {
    setActiveIndex(i);
    navigate(`/team/${teamId}/${path}`);
  };

  return (
    <div className="w-56 h-screen bg-zinc-800 flex flex-col p-4 font-inter">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 mb-6 justify-start">
        <div className="w-7 h-7 flex items-center justify-center bg-slate-200 rounded-full text-[12px] text-slate-900 font-normal leading-none font-inter">
          CE
        </div>
        <span className="text-neutral-100 text-base font-bold leading-normal font-inter">
          Assignment
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-[2px] justify-start">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleNav(i, item.path)}
            className={`flex items-center gap-[6px] px-3 py-1.5 rounded-lg transition
              ${activeIndex === i ? "bg-neutral-700" : ""}
              hover:bg-[#434343] justify-start`}
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
            <span className="justify-start text-[#F7F7F7] text-xs font-medium font-['Inter'] leading-7">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
