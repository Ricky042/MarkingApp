import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";

// --- Main Page Component ---
import Sidebar from "../components/Sidebar";
import Navbar from "../components/NavbarAssignment";
import MenuItem from "../components/NavbarMenu";

// --- Helper Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-slate-900"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="flex justify-center items-center h-screen">
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  </div>
);

// --- Admin Comments Display ---
function AdminCommentsDisplay({ rubric, currentUserRole }) {
  // Display only admin comments rubric criteria
  const criteriaWithComments = rubric?.filter(criterion => 
    criterion.adminComments && criterion.adminComments.trim() !== ""
  ) || [];

  if (criteriaWithComments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-900 flex items-center">
        <span>Admin Feedback</span>
        {currentUserRole === 'tutor' && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            From Admin
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        {criteriaWithComments.map((criterion) => (
          <div key={criterion.id} className="border-l-4 border-deakinTeal pl-4 py-2 bg-blue-50 rounded">
            <h4 className="font-semibold text-slate-800 mb-1">
              {criterion.categoryName}
            </h4>
            <p className="text-slate-700 whitespace-pre-wrap text-sm">
              {criterion.adminComments}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin Report Section  ---
function AdminReportSection({ teamId, assignmentId, data, currentUserRole }) {
  const navigate = useNavigate();

  if (currentUserRole !== 'admin') {
    return null;
  }

  const { assignmentDetails, rubric, markers, controlPapers } = data;

  return (
    <div className="mt-6 bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-900">Reports & Analytics</h3>
        <button
          onClick={() => navigate(`/team/${teamId}/reports/${assignmentId}`, { 
            state: { preSelectedAssignmentId: assignmentId } 
          })}
          className="px-4 py-2 bg-deakinTeal text-white text-sm font-medium rounded-md hover:bg-[#0E796B] cursor-pointer flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Detailed Reports
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-slate-800">{controlPapers?.length || 0}</div>
          <div className="text-sm text-slate-600">Control Papers</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-slate-800">{markers?.length || 0}</div>
          <div className="text-sm text-slate-600">Markers</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-slate-800">{rubric?.length || 0}</div>
          <div className="text-sm text-slate-600">Criteria</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-slate-800">
            {(() => {
              const completedMarkers = markers?.filter(marker => {
                const allPapersMarked = controlPapers?.every(paper => 
                  paper.marks?.some(mark => mark.markerId === marker.id)
                );
                return allPapersMarked;
              }).length || 0;
              return `${completedMarkers}/${markers?.length || 0}`;
            })()}
          </div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>
      </div>

      <p className="text-slate-600 text-sm">
        Access comprehensive reports including deviation analysis, detailed marks comparison, and performance statistics.
      </p>
    </div>
  );
}


function CompletionPrompt({ status, teamId, assignmentId }) {
  const navigate = useNavigate();

  if (status === 'incomplete') {
    return (
      <div className="bg-green-50 border-l-4 border-deakinTeal text-deakinTeal p-4 mb-6" role="alert">
        <p className="font-bold">Action Required</p>
        <p>You have not yet submitted your marks for the control papers. Please complete this whenever possible.</p>
        <button
          onClick={() => navigate(`/team/${teamId}/assignments/${assignmentId}/mark`)}
          className="mt-2 px-4 py-2 bg-deakinTeal text-white text-sm font-medium rounded-md hover:bg-[#0E796B] cursor-pointer"
        >
          Mark Control Papers
        </button>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
        <p className="font-bold">All Done!</p>
        <p>You have successfully completed marking for the control paper.</p>
      </div>
    );
  }

  return null;
}


function ScoreComparisonTable({ data, currentUserRole }) {
  const [selectedPaperId, setSelectedPaperId] = useState('cp-A');
  const { assignmentDetails, rubric, markers, controlPapers } = data;

  // Get admin marker (standard) and others
  const adminMarker = markers?.find((m) => m.name?.toLowerCase().includes("admin")) || markers?.[0];
  const adminId = adminMarker?.id;
  
  
  const otherMarkers = markers
    .filter(m => m.id !== adminId)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedPaperData = controlPapers.find(p => p.id === selectedPaperId);
  const scoresMap = new Map();
  if (selectedPaperData) {
    selectedPaperData.marks.forEach(markerScores => {
      const innerMap = new Map();
      markerScores.scores.forEach(s => innerMap.set(s.rubricCategoryId, s.score));
      scoresMap.set(markerScores.markerId, innerMap);
    });
  }

  const getScore = (markerId, criterionId) => {
    return scoresMap.get(markerId)?.get(criterionId);
  };

  const adminScores = scoresMap.get(adminId);
  const isAdminMarked = adminScores && adminScores.size > 0;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">Marker Score Comparison</h3>

      <div className="mb-4">
        <label htmlFor="paper-select" className="block text-sm font-medium text-slate-700 mb-1">
          Showing scores for:
        </label>
        <select
          id="paper-select"
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(e.target.value)}
          className="p-2 border border-slate-300 rounded-md"
        >
          {controlPapers.map(paper => (
            <option key={paper.id} value={paper.id}>{paper.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Rubric Criterion</th>

              {adminMarker && (
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {adminMarker.name} (Standard)
                </th>
              )}

              {otherMarkers.map(marker => {
                // tutor view: only show self and admin
                if (
                  currentUserRole !== "admin" &&
                  marker.id !== data.currentUser?.id
                ) {
                  return null;
                }

                return (
                  <th key={marker.id} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {marker.name}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rubric.map(category => {
              const adminScore = adminScores ? getScore(adminId, category.id) : undefined;

              return (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-normal font-medium text-slate-900">{category.categoryName}</td>

                  {adminMarker && (
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold bg-slate-50 text-slate-800">
                      {typeof adminScore === 'number' ? adminScore : 'N/A'}
                    </td>
                  )}

                  {otherMarkers.map(marker => {
                    // tutor 视图：只显示自己和admin
                    if (
                      currentUserRole !== "admin" &&
                      marker.id !== data.currentUser?.id
                    ) {
                      return null;
                    }

                    const markerScore = getScore(marker.id, category.id);
                    let cellColor = 'bg-white';
                    if (isAdminMarked && typeof markerScore === 'number' && typeof adminScore === 'number') {
                      const difference = Math.abs(markerScore - adminScore);
                      const deviationPercentage = category.deviationScore;
                      const deviationThreshold = (deviationPercentage / 100) * category.maxScore;
                      if (difference < deviationThreshold) cellColor = 'bg-green-100 text-green-900';
                      else if (difference === deviationThreshold) cellColor = 'bg-yellow-100 text-yellow-900';
                      else cellColor = 'bg-red-100 text-red-900';
                    }

                    return (
                      <td key={marker.id} className={`px-6 py-4 whitespace-nowrap text-center font-medium ${cellColor}`}>
                        {typeof markerScore === 'number' ? markerScore : 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isAdminMarked && (
            <div className="mt-4 p-3 bg-lime-100 text-deakinTeal rounded-md text-sm">
                The standard marker has not yet marked this control paper. Score coloring is disabled until the standard is set.
            </div>
        )}
      </div>
    </div>
  );
}

// --- THE MAIN PAGE COMPONENT (Updated with new components) ---
export default function AssignmentDetails() {
  const { teamId, assignmentId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [userCompletionStatus, setUserCompletionStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await api.get(`/team/${teamId}/assignments/${assignmentId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        setAssignmentData(data);
        setCurrentUserRole(data.currentUser?.role);

        // This logic can stay, as the prompt is useful for all users
        const { currentUser, controlPapers } = data;
        let markedCount = 0;
        controlPapers.forEach(paper => {
          const userMark = paper.marks.find(mark => mark.markerId === currentUser.id);
          if (userMark && userMark.scores.length > 0) {
            markedCount++;
          }
        });
        setUserCompletionStatus(markedCount === controlPapers.length ? 'complete' : 'incomplete');

      } catch (err) {
        setError(err.response?.data?.message || "Failed to load assignment details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [teamId, assignmentId]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignmentData) return null;

  const { assignmentDetails } = assignmentData;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />

        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} assignmentName={assignmentDetails.course_name} assignmentSemester={assignmentDetails.semester} />

        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : "mr-0"}`}>

          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">{assignmentDetails.course_name}</h1>
              <p className="text-slate-600 mt-1">
                {assignmentDetails.course_code} • Semester {assignmentDetails.semester}
              </p>
            </div>

            <CompletionPrompt
              status={userCompletionStatus}
              teamId={teamId}
              assignmentId={assignmentId}
            />

            {/* Score Comparison Table - 现在传递 currentUserRole */}
            <ScoreComparisonTable 
              data={assignmentData} 
              currentUserRole={currentUserRole}
            />

            {/* Admin Comments - for tutor view only*/}
            <AdminCommentsDisplay 
              rubric={assignmentData.rubric} 
              currentUserRole={currentUserRole} 
            />

            {/* Admin Report Section*/}
            <AdminReportSection 
              teamId={teamId}
              assignmentId={assignmentId}
              data={assignmentData}
              currentUserRole={currentUserRole}
            />

          </main>
        </div>
      </div>
    </div>
  );
}