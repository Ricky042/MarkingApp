import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";

// --- NEW LIBRARY IMPORTS ---
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- ICONS & STANDARD COMPONENTS ---
import { ZoomIn, ZoomOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import LoadingSpinner from "../components/LoadingSpinner";

// PDF worker config
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const ErrorMessage = ({ message }) => (
  <div className="flex justify-center items-center h-screen bg-neutral-100">
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  </div>
);

function RubricCategory({ category, score, onScoreChange }) {
  const [selectedGrade, setSelectedGrade] = useState({ name: 'HD', label: 'High Distinction', color: 'bg-deakinTeal text-white' });
  const [feedback, setFeedback] = useState('');

  const grades = [
    { name: 'HD', label: 'High Distinction', color: 'bg-deakinTeal text-white' },
    { name: 'D', label: 'Distinction', color: 'bg-deakinTeal text-white' },
    { name: 'C', label: 'Credit', color: 'bg-deakinTeal text-white' },
    { name: 'P', label: 'Pass', color: 'bg-deakinTeal text-white' },
    { name: 'F', label: 'Fail', color: 'bg-deakinTeal text-white' }
  ];

  // Calculate placeholder score based on selected grade tier
  const getPlaceholderScore = () => {
    if (!category.tiers || category.tiers.length === 0) {
      // Fallback to standard percentages if tiers are not available
      const percentageMap = {
        'High Distinction': 0.80,  // 80% (user requested 16 for maxScore 20)
        'Distinction': 0.75,
        'Credit': 0.65,
        'Pass': 0.50,
        'Fail': 0.25
      };
      const percentage = percentageMap[selectedGrade.label] || 0.50;
      return Math.round(category.maxScore * percentage);
    }

    // Find the tier that matches the selected grade
    const tier = category.tiers.find(tier => tier.name === selectedGrade.label);
    if (tier) {
      // Use the lowerBound as the placeholder score
      return Math.round(tier.lowerBound);
    }

    // Fallback if tier not found
    return Math.round(category.maxScore * 0.50);
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
  };

  const placeholderScore = getPlaceholderScore();

  return (
    <div className="bg-white p-6 rounded-lg">
      {/* Criteria Title */}
      <h2 className="text-2xl font-bold text-deakinTeal mb-2">Criteria</h2>
      
      {/* Criterion Description */}
      <p className="text-sm text-slate-600 mb-6">{category.categoryName}</p>
      
      {/* Grade Buttons */}
      <div className="flex gap-2 mb-6">
        {grades.map((grade) => (
          <button
            key={grade.name}
            onClick={() => handleGradeSelect(grade)}
            className={`px-4 py-2 rounded-md font-semibold text-sm cursor-pointer ${
              selectedGrade?.name === grade.name 
                ? grade.color 
                : 'bg-white text-deakinTeal border border-deakinTeal'
            }`}
          >
            {grade.name}
          </button>
        ))}
      </div>

      {/* Selected Grade Details */}
      {selectedGrade && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-lg font-semibold text-deakinTeal">{selectedGrade.label}</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-20 p-2 border border-slate-300 rounded-md text-center"
                placeholder={placeholderScore}
                max={category.maxScore}
                min={0}
                value={score === null || score === undefined ? '' : score}
                onChange={(e) => onScoreChange(category.id, category.maxScore, e.target.value)}
              />
              <span className="text-deakinTeal font-semibold">/{category.maxScore}</span>
            </div>
          </div>
          
          {/* Grade Description */}
          {/* <p className="text-sm text-slate-600">
            {category.tiers.find(tier => tier.name === selectedGrade.label)?.description || 
             `Description for ${selectedGrade.label} grade...`}
          </p> */}
        </div>
      )}

      {/* Feedback Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-deakinTeal mb-3">Criterion Feedback (Optional)</h3>
        <textarea
          className="w-full p-3 border border-slate-300 rounded-md h-24 resize-none"
          placeholder="Add specific feedback for this criterion..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
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

  const [numPages, setNumPages] = useState(null);
  const [pdfScale, setPdfScale] = useState(1.0);

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
        setError(err.response?.data?.message || "Failed to load assignment data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarkingData();
  }, [teamId, assignmentId]);

  const handleScoreChange = (criterionId, maxScore, value) => {
    const newScore = value === '' ? '' : Math.max(0, Math.min(maxScore, Number(value)));
    setMarks(prevMarks => ({
      ...prevMarks,
      [selectedPaperId]: {
        ...prevMarks[selectedPaperId],
        [criterionId]: newScore,
      },
    }));
  };

  const handleSubmitMarks = async () => {
  const marksForCurrentPaper = marks[selectedPaperId];
  const rubricCategories = assignmentData.rubric;

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
    /*
    // 🌟 Optional: call completion endpoint if tutor finished both control papers
    const confirm = window.confirm("Submit completed marking for this assignment?");
    if (confirm) {
      await api.post(`/assignments/${assignmentId}/mark/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } buggy*/

    alert(`Marks for ${selectedPaperId} submitted successfully!`);
    navigate(`/team/${teamId}/assignments/${assignmentId}`);
  } catch (err) {
    alert(err.response?.data?.message || "Failed to submit marks. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  const zoomIn = () => setPdfScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  const zoomOut = () => setPdfScale(prevScale => Math.max(prevScale - 0.2, 0.4));

  if (isLoading) return <LoadingSpinner pageName="Marking" />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignmentData) return null;

  const { assignmentDetails, rubric, controlPapers } = assignmentData;
  const currentMarks = marks[selectedPaperId] || {};
  const selectedPaper = controlPapers.find(p => p.id === selectedPaperId);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-72 flex-1 flex flex-col bg-neutral-100">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : "mr-0"}`}>
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-[1200px] bg-slate-200">
              <div className="flex justify-between items-center bg-white border-b border-slate-300">
                <div className="flex flex-row items-center gap-2">
                  <button onClick={() => navigate(`/team/${teamId}/assignments/${assignmentId}`)} className="p-3 cursor-pointer text-slate-800 hover:opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 24" id="back-arrow">
                      <path fill="none" d="M0 0h24v24H0V0z" opacity=".87"></path>
                      <path d="M16.62 2.99c-.49-.49-1.28-.49-1.77 0L6.54 11.3c-.39.39-.39 1.02 0 1.41l8.31 8.31c.49.49 1.28.49 1.77 0s.49-1.28 0-1.77L9.38 12l7.25-7.25c.48-.48.48-1.28-.01-1.76z" fill="currentColor"></path>
                    </svg>
                  </button>
                  <h3 className="font-semibold text-slate-800">{selectedPaper?.name || "Document"}</h3>
                </div>
                <div className="flex items-center gap-2 pr-3">
                  <button onClick={zoomOut} className="p-1 rounded hover:bg-slate-200"><ZoomOut className="w-5 h-5"/></button>
                  <span className="text-sm font-medium w-12 text-center">{(pdfScale * 100).toFixed(0)}%</span>
                  <button onClick={zoomIn} className="p-1 rounded hover:bg-slate-200"><ZoomIn className="w-5 h-5"/></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4 h-screen">
                {selectedPaper?.filePath ? (
                  <div className="flex justify-center">
                    <Document
                      file={selectedPaper.filePath}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<div className="flex justify-center items-center h-full"><p>Loading PDF...</p></div>}
                      error={<div className="flex flex-col justify-center items-center min-h-[1000px] w-full"><img src="/broken-file-icon.png" alt="Broken file" className="w-19 mb-4 opacity-40" /><p className="text-[#A7A9AC] text-center">Failed to load PDF. Please check the file URL.</p></div>}
                    >
                      {Array.from(new Array(numPages), (el, index) => (
                        <Page
                          key={`page_${index + 1}`}
                          pageNumber={index + 1}
                          scale={pdfScale}
                          className="mb-4 shadow-lg"
                        />
                      ))}
                    </Document>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-slate-500">No document uploaded for this control paper.</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-screen overflow-y-auto">
              <main className="flex-1 p-6 overflow-y-auto">
               
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-deakinTeal">Control Paper</h2>
                  </div>
                </div>


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

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmitMarks}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-deakinTeal cursor-pointer text-white font-medium rounded-md hover:bg-[#0E796B] disabled:bg-slate-400"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit Marks for ${selectedPaper?.name || ''}`}
                  </button>
                </div>
              </main>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
      </div>
    </div>
  );
}