import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function ReportsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [assignments, setAssignments] = useState([]);
  
  // For filtering and searching
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      try {
        const res = await api.get(`/team/${teamId}/role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserRole(res.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();
  }, [teamId, navigate]);

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (currentUserRole !== "admin" && currentUserRole !== "tutor") return;
      
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      setIsLoading(true);
      try {
        const res = await api.get(`/team/${teamId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let filteredAssignments = res.data.assignments || [];
        
        if (currentUserRole === "tutor") {
          filteredAssignments = filteredAssignments.filter(
            (a) => a.status?.toLowerCase() === "completed"
          );
        }
        
        setAssignments(filteredAssignments);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUserRole) {
      fetchAssignments();
    }
  }, [teamId, currentUserRole, navigate]);

  // Handle assignment selection - use useEffect to avoid setState during render
  const handleAssignmentSelect = (assignment) => {
    navigate(`/team/${teamId}/reports/${assignment.id}`);
  };

  // Filtering and searching assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      // Semester filter
      const semesterMatch =
        !selectedSemester ||
        selectedSemester === "All Semesters" ||
        `Semester ${assignment.semester}` === selectedSemester;

      // Status filter
      let statusMatch = true;
      if (selectedStatus && selectedStatus !== "All Status") {
        if (currentUserRole === "admin") {
          statusMatch = assignment.status?.toUpperCase() === selectedStatus.toUpperCase();
        } else if (currentUserRole === "tutor") {
          statusMatch = assignment.status?.toUpperCase() === "COMPLETED";
        }
      }

      // Search filter
      let searchMatch = false;
      if (currentUserRole === "tutor") {
        searchMatch =
          assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (currentUserRole === "admin") {
        searchMatch =
          assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.status.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return semesterMatch && statusMatch && searchMatch;
    });
  }, [assignments, selectedSemester, selectedStatus, searchQuery, currentUserRole]);

  // Loading
  if (isLoading)
    return (
      <div className="ml-56 flex justify-center items-center h-screen">
        Loading reports...
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
        <Navbar onBurgerClick={() => setMenuOpen((v) => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div
          className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${
            menuOpen ? "ml-56" : "mr-0"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-6">
            <div className="text-offical-black text-3xl font-bold">Reports</div>
          </div>

          {/* Assignment List */}
          <div className="px-6 pb-8">
            {/* Filters and Search  */}
            <div className="flex items-center gap-4 mb-6 justify-between">
              {/* Semester Filter */}
              <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                <span className="flex-1 text-zinc-600 text-sm font-normal">
                  {selectedSemester || "Select semester"}
                </span>
                <img src="/AssignmentIcon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4" />
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="" disabled>Select semester</option>
                  <option value="All Semesters">All Semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              {/* Status Filter*/}
              {currentUserRole === "admin" && (
                <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                  <span className="flex-1 text-zinc-600 text-sm font-normal">
                    {selectedStatus || "Select status"}
                  </span>
                  <img src="/AssignmentIcon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4" />
                  <select
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="" disabled>Select status</option>
                    <option value="All Status">All Status</option>
                    <option value="MARKING">MARKING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              )}

              {/* Search Bar */}
              <div className="flex max-w-72 ml-auto">
                <div className="w-full min-h-8 px-3 py-2 bg-white rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                  <img
                    src="/navBarIcon/navBar_searchIcon.svg"
                    alt="Search Icon"
                    className="h-3 w-3"
                  />
                  <input
                    className="bg-transparent outline-none placeholder-zinc-500 text-sm w-full"
                    placeholder="Search assignments"
                    aria-label="Search assignments"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-zinc-700">
              {currentUserRole === "admin" 
                ? "All Assignments" 
                : "Completed Assignments"
              }
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleAssignmentSelect(a)}
                  className={`bg-white p-4 rounded-2xl shadow hover:shadow-md cursor-pointer transition ${
                    a.status?.toLowerCase() !== "completed" ? "opacity-75" : ""
                  }`}
                >
                  <div className="font-semibold text-lg text-slate-800">
                    {a.course_name}
                    {a.status?.toLowerCase() !== "completed" && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {a.status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-600">
                    {a.course_code} — Semester {a.semester}
                  </div>
                  <div className="mt-2 text-[var(--deakinTeal)] font-medium">
                    {a.status?.toLowerCase() === "completed" 
                      ? "View Report →" 
                      : "View Progress →"
                    }
                  </div>
                </div>
              ))}
              {filteredAssignments.length === 0 && (
                <div className="col-span-full text-center py-8 text-zinc-500">
                  No assignments found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}