import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";

// --- Standard Layout & Helper Components ---
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

// --- Helper Components ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-neutral-100">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-slate-900"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="flex justify-center items-center h-screen bg-neutral-100">
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  </div>
);

// --- Detailed Rubric Category Component ---
// Displays one full category of the rubric in a clear card format.
function RubricCategory({ category, score, onScoreChange }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      {/* Category Header & Score Input */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{category.categoryName}</h3>
          <p className="text-sm text-slate-500">Maximum Score: {category.maxScore}</p>
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <label htmlFor={`score-for-${category.id}`} className="font-semibold text-slate-700">Your Score:</label>
          <input
            id={`score-for-${category.id}`}
            type="number"
            className="w-28 p-2 border border-slate-300 rounded-md text-center text-lg font-bold focus:ring-2 focus:ring-slate-500 focus:outline-none"
            max={category.maxScore}
            min={0}
            value={score === null || score === undefined ? '' : score}
            onChange={(e) => onScoreChange(category.id, category.maxScore, e.target.value)}
            placeholder="Score"
          />
        </div>
      </div>

      {/* Tiers Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {category.tiers.map((tier) => (
          <div key={tier.name} className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <h4 className="font-semibold text-slate-800">{tier.name}</h4>
            <p className="text-xs font-medium text-slate-600 mb-1">
              ({tier.lowerBound} - {tier.upperBound} pts)
            </p>
            <p className="text-sm text-slate-700">{tier.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- THE MAIN MARKING PAGE COMPONENT ---
export default function MarkingPage() {
  const { teamId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [selectedPaperId, setSelectedPaperId] = useState('cp-A'); 
  const [marks, setMarks] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch the full assignment data, including the detailed rubric with tiers
  useEffect(() => {
    const fetchMarkingData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await api.get(`/team/${teamId}/assignments/${assignmentId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignmentData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load assignment rubric.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarkingData();
  }, [teamId, assignmentId]);

  // Handler for when a score is entered into an input box
  const handleScoreChange = (criterionId, maxScore, value) => {
    // Sanitize input: allow empty string for clearing, otherwise clamp to range
    const newScore = value === '' ? '' : Math.max(0, Math.min(maxScore, Number(value)));

    setMarks(prevMarks => ({
      ...prevMarks,
      [selectedPaperId]: {
        ...prevMarks[selectedPaperId],
        [criterionId]: newScore,
      },
    }));
  };

  // Handler for the submit button
  const handleSubmitMarks = async () => {
    const marksForCurrentPaper = marks[selectedPaperId];
    const rubricCategories = assignmentData.rubric;

    // Validate that all categories have a score
    if (!marksForCurrentPaper || rubricCategories.some(cat => marksForCurrentPaper[cat.id] === undefined || marksForCurrentPaper[cat.id] === '')) {
      alert("Please enter a score for every rubric category before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        paperId: selectedPaperId,
        scores: Object.entries(marksForCurrentPaper).map(([criterionId, score]) => ({
          criterionId: Number(criterionId),
          score: Number(score)
        })),
      };

      const token = localStorage.getItem("token");
      await api.post(`/assignments/${assignmentId}/mark`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Marks for ${selectedPaperId} submitted successfully!`);
      navigate(`/team/${teamId}/assignment/${assignmentId}`); // Navigate back to the details page

    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit marks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignmentData) return null;

  const { assignmentDetails, rubric, controlPapers } = assignmentData;
  const currentMarks = marks[selectedPaperId] || {};

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
            <p className="text-slate-600 mt-1">Control Paper Marking</p>
          </div>

          {/* Control Paper Selector */}
          <div className="mb-6">
            <label htmlFor="paper-select" className="block text-sm font-medium text-slate-700 mb-1">Select Paper to Mark:</label>
            <select
              id="paper-select"
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="p-2 border border-slate-300 rounded-md w-full max-w-xs"
            >
              {controlPapers.map(paper => (
                <option key={paper.id} value={paper.id}>{paper.name}</option>
              ))}
            </select>
          </div>

          {/* New Detailed Rubric Display */}
          <div className="space-y-6">
            {rubric.map(category => (
              <RubricCategory
                key={category.id}
                category={category}
                score={currentMarks[category.id]}
                onScoreChange={handleScoreChange}
              />
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitMarks}
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Submitting...' : `Submit Marks for ${assignmentData.controlPapers.find(p => p.id === selectedPaperId)?.name || ''}`}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}