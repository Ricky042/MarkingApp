// Sidebar.jsx
import { Home, FileText, Users, Flag, BarChart, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: <Home size={16} /> },
  { label: "Assignments", icon: <FileText size={16} /> },
  { label: "Markers", icon: <Users size={16} /> },
  { label: "Flags", icon: <Flag size={16} /> },
  { label: "Reports / Exports", icon: <BarChart size={16} /> },
  { label: "Settings", icon: <Settings size={16} /> },
];

export default function Sidebar() {
  return (
    <div className="w-52 h-screen bg-[#2C2C2C] flex flex-col p-4 text-[#F7F7F7]">
      {/* Logo / Title */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full text-[10px] text-slate-900 font-inter">
          CE
        </div>
        <span className="text-sm font-bold">Assignment</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#434343] transition"
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
