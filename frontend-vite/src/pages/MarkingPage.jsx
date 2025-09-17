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

// PDF worker config
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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

function RubricCategory({ category, score, onScoreChange }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
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

      alert(`Marks for ${selectedPaperId} submitted successfully!`);
      navigate(`/team/${teamId}/assignment/${assignmentId}`);

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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!assignmentData) return null;

  const { assignmentDetails, rubric, controlPapers } = assignmentData;
  const currentMarks = marks[selectedPaperId] || {};
  const selectedPaper = controlPapers.find(p => p.id === selectedPaperId);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-56 flex-1 flex flex-col bg-neutral-100">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : "mr-0"}`}>
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full bg-slate-200">
              <div className="flex justify-between items-center p-2 bg-white border-b border-slate-300">
                <h3 className="font-semibold text-slate-800">{selectedPaper?.name || "Document"}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={zoomOut} className="p-1 rounded hover:bg-slate-200"><ZoomOut className="w-5 h-5"/></button>
                  <span className="text-sm font-medium w-12 text-center">{(pdfScale * 100).toFixed(0)}%</span>
                  <button onClick={zoomIn} className="p-1 rounded hover:bg-slate-200"><ZoomIn className="w-5 h-5"/></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {selectedPaper?.filePath ? (
                  <Document
                    file={selectedPaper.filePath}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex justify-center items-center h-full"><p>Loading PDF...</p></div>}
                    error={<div className="flex justify-center items-center h-full"><p className="text-red-600">Failed to load PDF. Please check the file URL.</p></div>}
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
            <div className="flex flex-col h-full overflow-hidden">
              <main className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">{assignmentDetails.title}</h1>
                  <p className="text-slate-600">Control Paper Marking</p>
                </div>
                <div className="mb-6">
                  <label htmlFor="paper-select" className="block text-sm font-medium text-slate-700 mb-1">Select Paper to Mark:</label>
                  <select
                    id="paper-select"
                    value={selectedPaperId}
                    onChange={(e) => {
                      setSelectedPaperId(e.target.value);
                      setNumPages(null);
                    }}
                    className="p-2 border border-slate-300 rounded-md w-full max-w-xs"
                  >
                    {controlPapers.map(paper => (
                      <option key={paper.id} value={paper.id}>{paper.name}</option>
                    ))}
                  </select>
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
                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400"
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