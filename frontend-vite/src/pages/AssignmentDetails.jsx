import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";

// --- Main Page Component ---
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

// --- Helper Components (can be moved to their own files if desired) ---

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

// --- Sub-components for the Assignment Details Page ---

// 1. The prompt header for control paper marking status
function CompletionPrompt({ status, teamId, assignmentId }) {
  const navigate = useNavigate();

  if (status === 'incomplete') {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Action Required</p>
        <p>You have not yet submitted your marks for the control papers. Please complete this whenever possible.</p>
        <button
          onClick={() => navigate(`/team/${teamId}/assignment/${assignmentId}/mark`)}
          className="mt-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800"
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
        <p>You have successfully completed marking for both control papers.</p>
      </div>
    );
  }

  return null; // Don't render anything if status is not determined yet
}

// 2. The Admin's powerful score comparison table
function AdminScoreTable({ data }) {
  const [selectedPaperId, setSelectedPaperId] = useState('cp-A');
  const { rubric, markers, controlPapers, currentUser } = data;

  // Find the data for the currently selected paper
  const selectedPaperData = controlPapers.find(p => p.id === selectedPaperId);
  if (!selectedPaperData) return <p>No data for selected paper.</p>;

  // Find the admin's marks for this paper and create a quick-lookup map
  const adminMarksData = selectedPaperData.marks.find(m => m.markerId === currentUser.id);
  const adminScoresMap = new Map();
  if (adminMarksData) {
    adminMarksData.scores.forEach(s => adminScoresMap.set(s.rubricCategoryId, s.score));
  }
  const isAdminMarked = adminScoresMap.size > 0;

  // Determine which markers haven't finished marking BOTH control papers
  const markedSet = new Set();
  controlPapers.forEach(paper => {
      paper.marks.forEach(markerScore => {
        if(markerScore.scores.length > 0) markedSet.add(markerScore.markerId);
      });
  });
  const unfinishedMarkers = markers.filter(marker => !markedSet.has(marker.id));

  // Sort markers to ensure admin is first in the table display
  const sortedMarkers = [...markers].sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mt-8 bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">Marker Score Comparison</h3>
      
      <div className="flex justify-between items-center mb-4">
        {/* Dropdown to select control paper */}
        <select
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(e.target.value)}
          className="p-2 border border-slate-300 rounded-md"
        >
          {controlPapers.map(paper => (
            <option key={paper.id} value={paper.id}>{paper.name}</option>
          ))}
        </select>

        {/* Unfinished Markers List */}
        {unfinishedMarkers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-slate-600">Marking Incomplete:</h4>
            <ul className="text-sm text-slate-500">
              {unfinishedMarkers.map(marker => <li key={marker.id}>{marker.name}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* The Scores Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rubric Category</th>
              {sortedMarkers.map(marker => (
                <th key={marker.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {marker.name}{marker.id === currentUser.id ? ' (Standard)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rubric.map(category => {
              const adminScore = adminScoresMap.get(category.id);

              return (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{category.categoryName}</td>
                  {sortedMarkers.map(marker => {
                    const markerData = selectedPaperData.marks.find(m => m.markerId === marker.id);
                    const markerScoreData = markerData?.scores.find(s => s.rubricCategoryId === category.id);
                    const score = markerScoreData?.score;

                    let cellColor = 'bg-white';
                    if (marker.id !== currentUser.id && isAdminMarked && typeof score === 'number') {
                      const difference = Math.abs(score - adminScore);
                      const deviation = category.deviationScore;
                      if (difference < deviation) cellColor = 'bg-green-100 text-green-800';
                      else if (difference === deviation) cellColor = 'bg-yellow-100 text-yellow-800';
                      else cellColor = 'bg-red-100 text-red-800';
                    } else if (marker.id === currentUser.id) {
                      cellColor = 'bg-slate-50 font-semibold';
                    }

                    return (
                      <td key={marker.id} className={`px-6 py-4 whitespace-nowrap text-center ${cellColor}`}>
                        {typeof score === 'number' ? score : 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isAdminMarked && (
            <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded-md text-sm">
                The Admin has not yet marked this control paper. Score coloring is disabled until the standard is set.
            </div>
        )}
      </div>
    </div>
  );
}


// --- THE MAIN PAGE COMPONENT ---
export default function AssignmentDetails() {
  const { teamId, assignmentId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [userCompletionStatus, setUserCompletionStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

        // --- Logic to check if the current user has marked BOTH control papers ---
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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [teamId, assignmentId]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignmentData) return null;

  const { assignmentDetails, rubric, currentUser } = assignmentData;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />

        <div className={`fixed inset-0 z-40 ${menuOpen ? '' : 'pointer-events-none'}`}>
          <div className="absolute inset-0" onClick={() => setMenuOpen(false)} />
          <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        </div>

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">{assignmentDetails.title}</h1>
            <p className="text-slate-600 mt-1">{assignmentDetails.description}</p>
          </div>

          {/* Completion Prompt */}
          <CompletionPrompt
            status={userCompletionStatus}
            teamId={teamId}
            assignmentId={assignmentId}
          />

          {/* Admin Score Table (conditionally rendered) */}
          {currentUser.role === 'admin' && <AdminScoreTable data={assignmentData} />}

          {/* Rubric View (visible to everyone) */}
          <div className="mt-8 bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-xl font-semibold mb-4 text-slate-900">Assignment Rubric</h3>
            <ul className="space-y-4">
              {rubric.map(cat => (
                <li key={cat.id} className="p-4 bg-slate-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{cat.categoryName}</span>
                    <span className="text-sm text-slate-600">Max Points: {cat.maxScore}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}