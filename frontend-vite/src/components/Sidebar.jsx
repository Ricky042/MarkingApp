// Sidebar.jsx
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: "/Sidebar/icon/layout.svg" },
  { label: "Assignments", icon: "/Sidebar/icon/clipboard-signature.svg" },
  { label: "Markers", icon: "/Sidebar/icon/users.svg" },
  { label: "Flags", icon: "/Sidebar/icon/flag.svg" },
  { label: "Reports / Exports", icon: "/Sidebar/icon/file-output.svg" },
  { label: "Settings", icon: "/Sidebar/icon/settings.svg" },
];

export default function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0);

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
            onClick={() => setActiveIndex(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition
              ${activeIndex === i ? "bg-neutral-700" : ""}
              hover:bg-[#434343]`}
          >
            <img
              src={item.icon}
              alt={item.label + " icon"}
              className="w-5 h-5"
            />
            <span className="text-[#F7F7F7] text-sm font-medium leading-6 font-inter">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
