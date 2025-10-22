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

// --- Sub-components for the Assignment Details Page ---

// 1. The prompt header for control paper marking status
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
        <p>You have successfully completed marking for both control papers.</p>
      </div>
    );
  }

  return null;
}

// 2. The Score Comparison Table (Now shown to everyone)
function ScoreComparisonTable({ data }) {
  const [selectedPaperId, setSelectedPaperId] = useState('cp-A');
  const { assignmentDetails, rubric, markers, controlPapers } = data;

  const standardMarkerId = assignmentDetails.created_by;
  const standardMarker = markers.find(m => m.id === standardMarkerId);
  const otherMarkers = markers
    .filter(m => m.id !== standardMarkerId)
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

  const standardScores = scoresMap.get(standardMarkerId);
  const isStandardMarked = standardScores && standardScores.size > 0;

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
              
              {standardMarker && (
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {standardMarker.name} (Standard)
                </th>
              )}

              {otherMarkers.map(marker => (
                <th key={marker.id} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {marker.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rubric.map(category => {
              const standardScore = standardScores ? getScore(standardMarkerId, category.id) : undefined;
              
              return (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-normal font-medium text-slate-900">{category.categoryName}</td>
                  
                  {standardMarker && (
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold bg-slate-50 text-slate-800">
                      {typeof standardScore === 'number' ? standardScore : 'N/A'}
                    </td>
                  )}

                  {otherMarkers.map(marker => {
                    const markerScore = getScore(marker.id, category.id);
                    let cellColor = 'bg-white';
                    if (isStandardMarked && typeof markerScore === 'number' && typeof standardScore === 'number') {
                      const difference = Math.abs(markerScore - standardScore);
                      const deviation = category.deviationScore;
                      if (difference < deviation) cellColor = 'bg-green-100 text-green-900';
                      else if (difference === deviation) cellColor = 'bg-yellow-100 text-yellow-900';
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
        {!isStandardMarked && (
            <div className="mt-4 p-3 bg-lime-100 text-deakinTeal rounded-md text-sm">
                The standard marker has not yet marked this control paper. Score coloring is disabled until the standard is set.
            </div>
        )}
      </div>
    </div>
  );
}


// --- THE MAIN PAGE COMPONENT (Updated with No Role-Based Rendering) ---
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
  console.log(assignmentDetails);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />

        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} assignmentName={assignmentDetails.course_name} assignmentSemester={assignmentDetails.semester}/>
        
        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : "mr-0"}`}>

          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">{assignmentDetails.title}</h1>
              <p className="text-slate-600 mt-1">{assignmentDetails.description}</p>
            </div>

            <CompletionPrompt
              status={userCompletionStatus}
              teamId={teamId}
              assignmentId={assignmentId}
            />
            
            {/* --- THE FIX IS HERE --- */}
            {/* We are now ALWAYS rendering the ScoreComparisonTable for every user. */}
            {/* This removes the dependency on the user's role for now. */}
            <ScoreComparisonTable data={assignmentData} />

            {/* The old, simple rubric has been completely removed to avoid confusion. */}

          </main>
        </div>
      </div>
    </div>
  );
}