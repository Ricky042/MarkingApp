// Sidebar.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: "/Sidebar/icon/layout.svg", path: "dashboard" },
  { label: "Assignments", icon: "/Sidebar/icon/clipboard-signature.svg", path: "assignments" },
  { label: "Markers", icon: "/Sidebar/icon/users.svg", path: "markers" },
  { label: "Flags", icon: "/Sidebar/icon/flag.svg", path: "flags" },
  { label: "Reports / Exports", icon: "/Sidebar/icon/file-output.svg", path: "reports" },
  { label: "Settings", icon: "/Sidebar/icon/settings.svg", path: "settings" },
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
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 flex items-center justify-center bg-slate-200 rounded-full text-[12px] text-slate-900 font-normal leading-none font-inter">
          CE
        </div>
        <span className="text-neutral-100 text-base font-bold leading-normal font-inter">
          Assignment
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-[2px]">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleNav(i, item.path)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition
              ${activeIndex === i ? "bg-neutral-700" : ""}
              hover:bg-[#434343]`}
          >
            <img
              src={item.icon}
              alt={item.label + " icon"}
              className="w-5 h-5"
            />
            <div className="justify-start text-Official-White text-xs font-medium font-['Inter'] leading-7">
              {item.label}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
