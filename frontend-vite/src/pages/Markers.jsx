import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import MarkerCard from "../components/MarkerCard";

export default function Markers() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [markers, setMarkers] = useState([]);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch team markers
    const fetchMarkers = async () => {
      try {
        const res = await api.get(`/team/${teamId}/markers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMarkers(res.data);
      } catch (err) {
        console.error("Error fetching markers:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkers();
  }, [navigate, teamId]);

  if (isLoading) return (
    <div className="ml-56 flex justify-center items-center h-screen">
      Loading markers...
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar activeTab={2} />
      </aside>

      {/* Main Content */}
      <div className="ml-56 flex-1 flex flex-col bg-white">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
        <MenuItem 
          menuOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        
        <div className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : ""}`}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-6">
            <h1 className="text-offical-black text-3xl font-bold pt-4 pb-4">
              Markers
            </h1>
            <button
              className="px-4 py-4 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-[#0E796B] transition"
              onClick={() => navigate(`/team/${teamId}/markers/new`)}
            >
              <span className="text-white text-lg font-base">
                + Invite Markers
              </span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 px-6 mb-4 justify-between">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-4">
              <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                <span className="flex-1 text-zinc-600 text-sm font-normal">
                  {sortBy === "default" ? "Sort By" : 
                   sortBy === "alphabetical" ? "Alphabetical Order" : 
                   sortBy === "date" ? "Date Added" : "Sort By"}
                </span>
                <img src="/AssignmentIcon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4" />
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Sort By</option>
                  <option value="alphabetical">Alphabetical Order</option>
                  <option value="date">Date Added</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex max-w-72">
              <div className="min-h-8 px-3 py-2 bg-white rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                <img
                  src="/navBarIcon/navBar_searchIcon.svg"
                  alt="Search Icon"
                  className="h-3 w-3"
                />
                <input
                  className="bg-transparent outline-none placeholder-zinc-500 text-sm w-full"
                  placeholder="Search markers"
                  aria-label="Search markers"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>


          </div>

          {/* Markers Grid */}
          <div className="px-6 py-4">
            {markers.length === 0 ? (
              <p className="text-center text-gray-500">No markers yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markers.map((marker) => (
                  <MarkerCard
                    key={marker.user_id}
                    id={marker.user_id}
                    name={marker.username}
                    status={marker.role === "admin" ? "Admin" : "Tutor"}
                    gradedCount={Math.floor(Math.random() * 10) + 1} // placeholder
                    totalCount={12}
                    percentage={Math.floor(Math.random() * 100)} // placeholder
                    deviation="+0%"
                    flagsRaised={Math.floor(Math.random() * 5)} // placeholder
                    onRemove={() => console.log(`Remove ${marker.username}`)}
                    onSendEmail={() =>
                      console.log(`Send email to ${marker.username}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
