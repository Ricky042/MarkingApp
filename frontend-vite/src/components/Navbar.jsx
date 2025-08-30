import { useNavigate } from "react-router-dom";
import TeamSwitcher from "./TeamSwitcher";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange")); // sync with App.jsx
    navigate("/login");
  };

  return (
    <nav className="p-4 bg-gray-800 text-white flex justify-between items-center">
      <h1 className="text-lg font-bold">MarkingApp</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/create-team")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Team
        </button>

        <TeamSwitcher />

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
