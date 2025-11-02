import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function ReportPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reportStats, setReportStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [detailedMarks, setDetailedMarks] = useState([]);
  
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
    fetchAssignments();
  }, [teamId, currentUserRole, navigate]);

  // Select assignment and fetch report data
  useEffect(() => {
    if (!selectedAssignment) return;
    
    const fetchDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await api.get(
          `/team/${teamId}/assignments/${selectedAssignment.id}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;

        // Avgerage score calculation
        const marksArray = [];
        data.controlPapers?.forEach((paper) => {
          paper.marks?.forEach((m) => {
            m.scores?.forEach((s) => marksArray.push(Number(s.score)));
          });
        });

        
        let averageScore = 0;
        if (marksArray.length > 0) {
          const sum = marksArray.reduce((acc, val) => acc + val, 0);
          const maxPoints = data.rubric?.reduce(
            (acc, r) => acc + Number(r.maxScore || 0),
            0
          );
          averageScore = ((sum / marksArray.length) / maxPoints) * 100;
          averageScore = Math.round(averageScore * 10) / 10;
        }

        const totalSubmissions = data.controlPapers?.length || 0;
        const markers = data.markers?.length || 0;
        const markersCompleted = data.markersAlreadyMarked || 0;
        const withinDeviation =
          data.rubric?.filter((r) => r.deviationScore <= 10)?.length || 0;

        setReportStats({
          totalSubmissions,
          averageScore: isNaN(averageScore) ? 0 : averageScore,
          withinDeviation,
          outsideDeviation: (data.rubric?.length || 0) - withinDeviation,
          flagsOpen: Math.max(0, markers - markersCompleted),
        });

        setReportData(data);

        // Get detailed marks
        await fetchDetailedMarks(data);
      } catch (err) {
        console.error("Error fetching assignment details:", err);
      }
    };

    // Get detailed marks function
    // I know it looks weird to define inside another function, but it's only for better clarity 
    const fetchDetailedMarks = async (assignmentData) => {
      try{
      constructDetailedMarksFromExistingData(assignmentData);}
      catch(err){
        console.error("Error constructing detailed marks:", err);
      };
    }
    const constructDetailedMarksFromExistingData = (assignmentData) => {
      const marks = [];
      const submissions = assignmentData.controlPapers || [];
      const rubric = assignmentData.rubric || [];
      const markers = assignmentData.markers || [];

      submissions.forEach(submission => {
        submission.marks?.forEach(mark => {
          const marker = markers.find(m => m.id === mark.markerId);
          mark.scores?.forEach(score => {
            const rubricItem = rubric.find(r => r.id === score.rubricCategoryId);
            marks.push({
              id: `${submission.id}-${mark.markerId}-${score.rubricCategoryId}`,
              submissionId: submission.id,
              isControlPaper: submission.is_control_paper,
              markerId: mark.markerId,
              markerName: marker?.name || 'Unknown Marker',
              criterionId: score.rubricCategoryId,
              criterionName: rubricItem?.categoryName || 'Unknown Criterion',
              marksAwarded: score.score,
              maxScore: rubricItem?.maxScore || 0,
              comments: score.comments || 'No comments',
              createdAt: mark.createdAt || new Date().toISOString()
            });
          });
        });
      });

      setDetailedMarks(marks);
    };

    fetchDetails();
  }, [selectedAssignment, teamId]);

  // Update admin comment
  const updateAdminComment = async (criterionId, comment) => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.post(
        `/team/${teamId}/assignments/${selectedAssignment.id}/rubric-criteria/${criterionId}/admin-comment`,
        { adminComment: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setReportData(prev => ({
        ...prev,
        rubric: prev.rubric.map(criterion => 
          criterion.id === criterionId 
            ? { ...criterion, adminComments: comment }
            : criterion
        )
      }));
      
      setEditingComment(null);
      setCommentText("");
      
      return res.data;
    } catch (err) {
      console.error("Error updating admin comment:", err);
      alert("Failed to update comment");
    }
  };

  // Editing comment
  const startEditingComment = (criterion) => {
    setEditingComment(criterion.id);
    setCommentText(criterion.adminComments || "");
  };

  // Cancel editing comment
  const cancelEditing = () => {
    setEditingComment(null);
    setCommentText("");
  };

  // Filtering and searching assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      // Semesre filter
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

      // Researching 
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
      <div className="ml-72 flex justify-center items-center h-screen">
        Loading reports...
      </div>
    );


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
            <div className="text-offical-black text-3xl font-bold">Reports</div>
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
                    onClick={() => setSelectedAssignment(a)}
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
                        : "Report not available"
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

          {/* Report Detail */}
          {selectedAssignment && reportStats && (
            <div className="px-6 pb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedAssignment.course_name}
                    {selectedAssignment.status?.toLowerCase() !== "completed" && (
                      <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {selectedAssignment.status}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {selectedAssignment.course_code} — Semester{" "}
                    {selectedAssignment.semester}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setReportStats(null);
                    setReportData(null);
                    setDetailedMarks([]);
                    setEditingComment(null);
                    setCommentText("");
                  }}
                  className="text-[var(--deakinTeal)] hover:underline"
                >
                  ← Back to list
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard value={reportStats.totalSubmissions} label="Total submissions" />
                <StatCard value={`${reportStats.averageScore}%`} label="Average score" />
                <StatCard value={reportStats.withinDeviation} label="Within deviation" />
                <StatCard value={reportStats.outsideDeviation} label="Outside deviation" />
                <StatCard value={reportStats.flagsOpen} label="Flags open" />
              </div>

              {/* Mark comparison table */}
              {reportData && (
                <>
                  <DeviationTable
                    data={reportData}
                    currentUserRole={currentUserRole}
                  />
                  
                  {/* Detailed mark table */}
                  <DetailedMarksTable 
                    data={detailedMarks}
                    currentUserRole={currentUserRole}
                    markers={reportData.markers || []}
                    reportData={reportData}
                  />

                  {/* Final admin Comments on Rubric Criteria */}
                  <RubricAdminComments
                    rubricCriteria={reportData.rubric || []}
                    currentUserRole={currentUserRole}
                    editingComment={editingComment}
                    commentText={commentText}
                    onStartEditing={startEditingComment}
                    onCancelEditing={cancelEditing}
                    onUpdateComment={updateAdminComment}
                    onCommentTextChange={setCommentText}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stats card 
function StatCard({ value, label }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-zinc-600">{label}</p>
    </div>
  );
}

// The deviation comparison table component
function DeviationTable({ data, currentUserRole }) {
  const rubric = data.rubric || [];
  const markers = data.markers || [];
  const papers = data.controlPapers || [];

  const controlPaper = papers[0];
  if (!controlPaper) return null;

  // Construct scores map: markerId -> { rubricCategoryId -> score }
  const scoresMap = {};
  controlPaper.marks.forEach((m) => {
    scoresMap[m.markerId] = {};
    m.scores.forEach((s) => {
      scoresMap[m.markerId][s.rubricCategoryId] = Number(s.score);
    });
  });

  // Get admin marker ID
  const adminMarker =
    markers.find((m) => m.name?.toLowerCase().includes("admin")) || markers[0];
  const adminId = adminMarker.id;

  return (
    <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto mb-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Mark Comparison Table
      </h3>
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border-r">Marker</th>
            {rubric.map((r) => (
              <th key={r.id} className="p-2 border-r text-center">
                {r.categoryName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {markers.map((marker) => {
            // tutor view: only show self and admin
            if (
              currentUserRole !== "admin" &&
              marker.id !== adminId &&
              marker.id !== data.currentUser.id
            ) {
              return null;
            }

            return (
              <tr key={marker.id} className="border-t">
                <td className="p-2 border-r font-medium text-slate-700">
                  {marker.name}
                </td>
                {rubric.map((r) => {
                  const adminScore = scoresMap[adminId]?.[r.id];
                  const thisScore = scoresMap[marker.id]?.[r.id];
                  let bg = "bg-gray-100";
                  let tooltip = "";

                  if (thisScore !== undefined && adminScore !== undefined) {
                    const diff = Math.abs(thisScore - adminScore);
                    if (marker.id === adminId) {
                      bg = "bg-white-200";
                      tooltip = "Admin score";
                    } else if (diff === 0) {
                      bg = "bg-green-200";
                      tooltip = "Same as admin";
                    } else if (diff <= r.deviationScore) {
                      bg = "bg-yellow-200";
                      tooltip = `Within deviation (Δ ${diff.toFixed(2)})`;
                    } else {
                      bg = "bg-red-200";
                      tooltip = `Outside deviation (Δ ${diff.toFixed(2)})`;
                    }
                  }

                  return (
                    <td
                      key={r.id}
                      className={`relative p-2 text-center border-r ${bg} group cursor-default`}
                    >
                      {thisScore !== undefined ? thisScore : "-"}
                      {tooltip && (
                        <div className="absolute hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg -top-8 left-1/2 transform -translate-x-1/2 z-10 whitespace-nowrap">
                          {tooltip}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// DetailedMarksTable component
function DetailedMarksTable({ data, currentUserRole, markers, reportData }) {
  const [expandedComments, setExpandedComments] = useState({});

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Detailed Marks with Comments
        </h3>
        <p className="text-gray-500">No detailed marks data available.</p>
      </div>
    );
  }

  // Get unique markers
  const uniqueMarkers = [...new Set(data.map(item => item.markerName))].sort();
  
  // Obtain unique criteria
  const criteria = [...new Set(data.map(item => item.criterionName))].sort();

  // Expand/collapse comment
  const toggleComment = (markId) => {
    setExpandedComments(prev => ({
      ...prev,
      [markId]: !prev[markId]
    }));
  };

  // Get admin marker and their marks
  const adminMarker = markers.find(m => m.name?.toLowerCase().includes("admin")) || markers[0];
  const adminMarks = data.filter(item => item.markerId === adminMarker?.id);

  return (
    <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Detailed Marks with Comments
      </h3>
      
      {/* Group by markers, detailed mark */}
      {uniqueMarkers.map(markerName => {
        const markerMarks = data.filter(item => item.markerName === markerName);
        const markerId = markerMarks[0]?.markerId;
        
        // tutor view: only show self and admin
        if (currentUserRole !== "admin" && 
            markerId !== adminMarker?.id && 
            markerId !== data[0]?.currentUserId) {
          return null;
        }

        return (
          <div key={markerName} className="mb-8 border border-gray-200 rounded-lg">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h4 className="font-semibold text-lg text-slate-800">
                Marker: {markerName}
                {markerId === adminMarker?.id && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
              </h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3 border-r font-medium">Criterion</th>
                    <th className="p-3 border-r font-medium text-center">Score</th>
                    <th className="p-3 border-r font-medium">Comments</th>
                    <th className="p-3 font-medium text-center">Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map(criterion => {
                    const mark = markerMarks.find(m => m.criterionName === criterion);
                    const adminMark = adminMarks.find(m => m.criterionName === criterion);
                    
                    if (!mark) return null;

                    
                    const rubricItem = reportData?.rubric?.find(r => r.categoryName === criterion);
                    const deviationThreshold = rubricItem?.deviationScore || 0;
                    const thisScore = mark.marksAwarded;
                    const adminScore = adminMark?.marksAwarded;

                    let diff = null;
                    let deviationStatus = 'bg-gray-100';
                    let deviationText = 'N/A';

                    if (adminMark && markerId !== adminMarker?.id) {
                      diff = Math.abs(thisScore - adminScore);
                      if (diff === 0) {
                        deviationStatus = 'bg-green-100 text-green-800';
                        deviationText = 'Exact match';
                      } else if (diff <= deviationThreshold) {
                        deviationStatus = 'bg-yellow-100 text-yellow-800';
                        deviationText = `Within deviation (Δ${diff.toFixed(2)})`;
                      } else {
                        deviationStatus = 'bg-red-100 text-red-800';
                        deviationText = `Outside deviation (Δ${diff.toFixed(2)})`;
                      }
                    }

                    return (
                      <tr key={`${markerName}-${criterion}`} className="border-t">
                        <td className="p-3 border-r font-medium text-slate-700">
                          {criterion}
                        </td>
                        <td className="p-3 border-r text-center">
                          <span className="font-semibold">
                            {mark.marksAwarded} / {mark.maxScore}
                          </span>
                        </td>
                        <td className="p-3 border-r max-w-xs">
                          <div className="relative">
                            <div 
                              className={`text-slate-700 ${
                                expandedComments[mark.id] 
                                  ? 'whitespace-normal' 
                                  : 'truncate max-w-xs'
                              }`}
                              onClick={() => toggleComment(mark.id)}
                            >
                              {mark.comments || 'No comments'}
                            </div>
                            {mark.comments && mark.comments.length > 50 && (
                              <button
                                onClick={() => toggleComment(mark.id)}
                                className="text-[var(--deakinTeal)] text-xs mt-1 hover:underline"
                              >
                                {expandedComments[mark.id] ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviationStatus}`}>
                              {deviationText}
                            </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Rubric Admin Comments component
function RubricAdminComments({ 
  rubricCriteria, 
  currentUserRole, 
  editingComment, 
  commentText, 
  onStartEditing, 
  onCancelEditing, 
  onUpdateComment, 
  onCommentTextChange 
}) {
  if (!rubricCriteria || rubricCriteria.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Rubric Admin Comments
        </h3>
        <p className="text-gray-500">No rubric criteria available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Rubric Admin Comments
      </h3>
      
      <div className="space-y-4">
        {rubricCriteria.map((criterion) => (
          <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-slate-800">
                  {criterion.categoryName}
                </h4>
                <p className="text-sm text-gray-600">
                  Points: {criterion.maxScore} | Deviation Threshold: {criterion.deviationScore}
                </p>
              </div>
              
              {currentUserRole === "admin" && (
                <button
                  onClick={() => onStartEditing(criterion)}
                  className="px-3 py-1 bg-[var(--deakinTeal)] text-white text-sm rounded hover:bg-[#0E796B] transition"
                >
                  {criterion.adminComments ? "Edit Comment" : "Add Comment"}
                </button>
              )}
            </div>

            {editingComment === criterion.id ? (
              <div className="mt-3">
                <textarea
                  value={commentText}
                  onChange={(e) => onCommentTextChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--deakinTeal)] focus:border-transparent"
                  rows="3"
                  placeholder="Enter your final comment for this rubric criterion after reviewing the markers' scores and comments."
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={onCancelEditing}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onUpdateComment(criterion.id, commentText)}
                    className="px-4 py-2 bg-[var(--deakinTeal)] text-white text-sm rounded hover:bg-[#0E796B] transition"
                  >
                    Save Comment
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                {criterion.adminComments ? (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-slate-700 whitespace-pre-wrap">{criterion.adminComments}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No admin comment yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}