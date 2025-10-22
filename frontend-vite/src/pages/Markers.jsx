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

  useEffect(() => {
    // Simple auth check - just verify token exists
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <> {/* Use a fragment to render modal outside the main layout div */}
      <div className="flex flex-row min-h-screen">
        <div className="flex flex-row min-h-screen w-56">
           <div className=" fixed h-screen w-56 border-r border-slate-200 z-50">
             <Sidebar activeTab={2} />
           </div>
        </div>
        <div className="flex-1 flex flex-col bg-neutral-00">
          <Navbar onBurgerClick = {() => setMenuOpen(v => !v)}/>
          {/* <MenuItem 
            menuOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
          /> */}

          <main className={`transition-all duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : ""}`}>
            {/* Page Header Section */}
            <div className="flex justify-between items-center px-6 py-6">
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

            {/* Filter Section */}
            <div className="flex items-center gap-4 px-6 mb-4 justify-between">
                
                {/* Search Bar*/}
                <div className="flex max-w-72">
                    <div className="min-h-8 px-3 py-2 bg-white rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                    <img
                        src="/navBarIcon/navBar_searchIcon.svg"
                        alt="Menu Icon"
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
            </div>

            {/* Page Content - Marker Cards Grid */}
            <div className="px-6 pb-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MarkerCard
                  id="0415132"
                  name="Mark Mitchell"
                  status="Marking"
                  gradedCount={5}
                  totalCount={12}
                  percentage={41}
                  deviation="+7%"
                  flagsRaised={7}
                  onRemove={() => console.log('Remove Mark Mitchell')}
                  onSendEmail={() => console.log('Send email to Mark Mitchell')}
                />
                <MarkerCard
                  id="0415133"
                  name="Jason Green"
                  status="Complete"
                  gradedCount={8}
                  totalCount={10}
                  percentage={80}
                  deviation="+2%"
                  flagsRaised={4}
                  onRemove={() => console.log('Remove Jason Green')}
                  onSendEmail={() => console.log('Send email to Jason Green')}
                />
                <MarkerCard
                  id="0415134"
                  name="Sarah Johnson"
                  status="Marking"
                  gradedCount={3}
                  totalCount={15}
                  percentage={20}
                  deviation="+5%"
                  flagsRaised={2}
                  onRemove={() => console.log('Remove Sarah Johnson')}
                  onSendEmail={() => console.log('Send email to Sarah Johnson')}
                />
                <MarkerCard
                  id="0415135"
                  name="David Wilson"
                  status="Complete"
                  gradedCount={12}
                  totalCount={12}
                  percentage={100}
                  deviation="+1%"
                  flagsRaised={1}
                  onRemove={() => console.log('Remove David Wilson')}
                  onSendEmail={() => console.log('Send email to David Wilson')}
                />
                <MarkerCard
                  id="0415136"
                  name="Emily Davis"
                  status="Moderating"
                  gradedCount={6}
                  totalCount={8}
                  percentage={75}
                  deviation="+3%"
                  flagsRaised={3}
                  onRemove={() => console.log('Remove Emily Davis')}
                  onSendEmail={() => console.log('Send email to Emily Davis')}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
