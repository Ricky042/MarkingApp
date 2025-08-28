import { useNavigate } from "react-router-dom";
import TeamSwitcher from "./TeamSwitcher";

export default function Navbar() {
  const navigate = useNavigate();

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
      </div>
    </nav>
  );
}