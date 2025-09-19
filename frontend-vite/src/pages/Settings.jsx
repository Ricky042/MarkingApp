import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import { Button } from "@/components/ui/button"; // adjust path if needed

export default function Settings() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);


  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const username = storedUser?.username || "User";
  // Apply theme to document when it changes

  const [theme, setTheme] = useState("light");

  // Load saved theme Not working now
  /*
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };*/


  const handleLogout = () => {
    // Clear user authentication data from storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Notify the app that authentication state has changed
    window.dispatchEvent(new Event("authChange"));

    // Navigate to the login page
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixed to the left */}
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        {/* Navbar */}
        <Navbar onBurgerClick={() => setMenuOpen((v) => !v)} />

        {/* Overlay menu for mobile */}
        <div className={`fixed inset-0 ${menuOpen ? "" : "pointer-events-none"}`}>
          <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
          <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        </div>

        {/* Page Content */}
        <div
          className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col px-6 py-6 ${
            menuOpen ? "ml-64" : "mr-0"
          }`}
        >
          <h1 className="text-2xl font-semibold mb-6">Settings</h1>

          {/* User info section */}
          <div className="absolute top-30 right-60 flex flex-col items-center">
            <div className="relative w-60 h-60 flex items-center justify-center">
              {/* Circle from public assets */}
              <img
                src="/Sidebar/Ellipse 1.svg"
                alt="Profile Circle"
                className="w-60 h-60 bg-slate-200 rounded-full"
              />
              <span className="absolute text-6xl text-slate-900 font-large leading-none">
                {username ? username.charAt(0).toUpperCase() : ""}
              </span>
            </div>
            <div className="text-lg font-medium text-gray-800">{username}</div>
          </div>

          {/* Settings actions */}
          <div className="flex flex-col gap-4 w-60">
            {/*Theme toggle button - not working now 
            
            <Button variant="secondary" onClick={toggleTheme}>
              Switch to {theme === "light" ? "Dark" : "Light"} Theme
            </Button>*/}

            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
    
}