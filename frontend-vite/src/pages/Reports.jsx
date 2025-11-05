import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ReportsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // For filtering and searching
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // For editing admin comments
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSemesterDropdownOpen && !event.target.closest('.semester-dropdown-container')) {
        setIsSemesterDropdownOpen(false);
      }
      if (isStatusDropdownOpen && !event.target.closest('.status-dropdown-container')) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSemesterDropdownOpen, isStatusDropdownOpen]);

  // get current user role
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
  if (isLoading) return <LoadingSpinner pageName="Reports" />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar activeTab={3} />
      </aside>

      {/* Main Content */}
      <div className="ml-72 flex-1 flex flex-col bg-white">
        <Navbar onBurgerClick={() => setMenuOpen((v) => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

        <div
          className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${
            menuOpen ? "ml-72" : "mr-0"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-6">
            <div className="text-offical-black text-3xl font-bold pt-4 pb-4">Reports</div>
          </div>

          {/* Assignment List */}
          {!selectedAssignment && (
            <div className="px-6 pb-8">
              {/* Filters and Search  */}
              <div className="flex items-center gap-4 mb-6 justify-between">
                {/* Semester Filter */}
                <div className="relative w-52 semester-dropdown-container">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSemesterDropdownOpen(!isSemesterDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                  >
                    <span className={`text-sm font-medium ${selectedSemester ? 'text-slate-900' : 'text-slate-500'}`}>
                      {selectedSemester || "Select semester"}
                    </span>
                    <img 
                      src="/AssignmentIcon/chevron-down.svg" 
                      alt="Dropdown arrow" 
                      className={`w-4 h-4 transition-transform duration-200 ${isSemesterDropdownOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isSemesterDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                      {[
                        { value: "", label: "Select semester", disabled: true },
                        { value: "All Semesters", label: "All Semesters" },
                        { value: "Semester 1", label: "Semester 1" },
                        { value: "Semester 2", label: "Semester 2" }
                      ].map((option) => {
                        const isSelected = selectedSemester === option.value;
                        return (
                          <button
                            key={option.value || "default"}
                            type="button"
                            disabled={option.disabled}
                            onClick={() => {
                              if (!option.disabled) {
                                setSelectedSemester(option.value);
                                setIsSemesterDropdownOpen(false);
                              }
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                              option.disabled 
                                ? 'text-slate-400 cursor-not-allowed' 
                                : isSelected 
                                  ? 'bg-slate-100 text-slate-900 font-semibold' 
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.label}</span>
                              {isSelected && !option.disabled && (
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Status Filter*/}
                {currentUserRole === "admin" && (
                  <div className="relative w-52 status-dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        setIsSemesterDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                    >
                      <span className={`text-sm font-medium ${selectedStatus ? 'text-slate-900' : 'text-slate-500'}`}>
                        {selectedStatus || "Select status"}
                      </span>
                      <img 
                        src="/AssignmentIcon/chevron-down.svg" 
                        alt="Dropdown arrow" 
                        className={`w-4 h-4 transition-transform duration-200 ${isStatusDropdownOpen ? 'transform rotate-180' : ''}`}
                      />
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                        {[
                          { value: "", label: "Select status", disabled: true },
                          { value: "All Status", label: "All Status" },
                          { value: "MARKING", label: "MARKING" },
                          { value: "COMPLETED", label: "COMPLETED" }
                        ].map((option) => {
                          const isSelected = selectedStatus === option.value;
                          return (
                            <button
                              key={option.value || "default"}
                              type="button"
                              disabled={option.disabled}
                              onClick={() => {
                                if (!option.disabled) {
                                  setSelectedStatus(option.value);
                                  setIsStatusDropdownOpen(false);
                                }
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                option.disabled 
                                  ? 'text-slate-400 cursor-not-allowed' 
                                  : isSelected 
                                    ? 'bg-slate-100 text-slate-900 font-semibold' 
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option.label}</span>
                                {isSelected && !option.disabled && (
                                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Search Bar */}
                <div className="flex max-w-72 ml-auto">
                  <div className="w-full min-h-8 px-3 py-2.5 bg-white rounded-lg border border-slate-300 flex items-center gap-1.5">
                    <img
                      src="/navBarIcon/navBar_searchIcon.svg"
                      alt="Search Icon"
                      className="h-3 w-3"
                    />
                    <input
                      className="bg-transparent outline-none placeholder-slate-500 text-sm w-full"
                      placeholder="Search assignments"
                      aria-label="Search assignments"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleAssignmentSelect(a)}
                  className={`bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-slate-200 px-6 pt-3.5 pb-4 hover:shadow-md transition cursor-pointer inline-flex flex-col justify-start items-start gap-1.5 ${
                    a.status?.toLowerCase() !== "completed" ? "opacity-100" : ""
                  }`}
                >
                  <div className="w-full inline-flex justify-between items-center">
                    <div className="text-xs text-zinc-400">
                      Semester {a.semester}
                    </div>
                    {a.status?.toLowerCase() !== "completed" && (
                      <div className={`px-3 pt-1 pb-1 rounded-full text-xs font-base ${(() => {
                        switch (a.status?.toLowerCase()) {
                          case 'marking':
                            return 'bg-lime text-gray-800';
                          case 'complete':
                            return 'bg-deakinTeal text-white';
                        }
                      })()}`}>
                        <div className="justify-start text-xs font-medium font-['Inter'] leading-normal">{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</div>
                      </div>
                    )}
                  </div>
                  <div className="w-48 text-offical-black text-2xl font-medium font-['Inter'] leading-7 text-left">
                    {a.course_name}
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">
                    {a.course_code}
                  </div>
                  <div className="flex-grow"></div>
                  <div className="w-full justify-end mt-4 text-md text-deakinTeal hover:text-deakinTeal">
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
        )}
        </div>
      </div>
    </div>
  );
}