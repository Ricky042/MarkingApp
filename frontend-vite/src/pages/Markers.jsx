import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MarkerCard from "../components/MarkerCard";

export default function Markers() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="flex flex-row min-h-screen">
        <div className="flex flex-row min-h-screen w-80">
          <div className="fixed h-screen w-80 border-r border-slate-200 z-50">
            <Sidebar activeTab={2} />
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-neutral-00">
          <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />

          <main
            className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${
              menuOpen ? "ml-72" : ""
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-6 py-6">
              <h1 className="text-offical-black text-3xl font-bold pt-4 pb-4">
                Markers
              </h1>
              <button
                className="px-4 py-4 bg-[var(--deakinTeal)] rounded-md inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-slate-800 transition"
                onClick={() => navigate(`/team/${teamId}/markers/new`)}
              >
                <span className="text-white text-lg font-base">
                  + Invite Markers
                </span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex justify-end items-center gap-6 mb-6 px-6">
              <div className="relative">
                <select className="appearance-none bg-transparent text-gray-700 text-md font-medium pr-6 cursor-pointer border-none outline-none">
                  <option value="all">All Assignments</option>
                  <option value="semester1">Semester 1 2025</option>
                  <option value="semester2">Semester 2 2025</option>
                </select>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select className="appearance-none bg-transparent text-gray-700 text-md font-medium pr-6 cursor-pointer border-none outline-none">
                  <option value="default">Sort By</option>
                  <option value="alphabetical">Alphabetical Order</option>
                  <option value="date">Date Added</option>
                </select>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {/* Marker Grid */}
            <div className="px-6 pb-6">
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
          </main>
        </div>
      </div>
    </>
  );
}