import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ReportDetailsPage() {
  const { teamId, assignmentId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // For editing admin comments
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Get current user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await api.get(`/team/${teamId}/role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserRole(res.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError("Failed to fetch user role");
      }
    };
    fetchUserRole();
  }, [teamId, navigate]);

  // Fetch assignment details and report data
  useEffect(() => {
    const fetchAssignmentAndReport = async () => {
      if (!assignmentId || !currentUserRole) return;

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching assignment details for:", assignmentId);
        
       
        try {
          const assignmentsRes = await api.get(
            `/team/${teamId}/assignments`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          

          const assignmentFromList = assignmentsRes.data.assignments?.find(
            a => a.id == assignmentId || String(a.id) === String(assignmentId)
          );
          
          if (assignmentFromList) {
            console.log("Found assignment in list:", assignmentFromList);
            setAssignmentStatus(assignmentFromList.status);
          } else {
            console.warn("Assignment not found in assignments list, will try alternative method");
          }
        } catch (listErr) {
          console.warn("Could not fetch assignments list:", listErr);
        }
        
        // Get detailed assignment and report data
        const detailsRes = await api.get(
          `/team/${teamId}/assignments/${assignmentId}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Details response:", detailsRes.data);
        
        const data = detailsRes.data;
        
        if (!data.assignmentDetails) {
          throw new Error("No assignment details found");
        }
        
        setAssignmentDetails(data.assignmentDetails);
        setReportData(data);

        // In case assignmentStatus was not set from the list, infer it here
        if (!assignmentStatus) {
          const totalMarkers = data.markers?.length || 0;
          const markersCompleted = data.markersAlreadyMarked || 0;
          
          if (markersCompleted >= totalMarkers) {
            setAssignmentStatus("COMPLETED");
          } else {
            setAssignmentStatus("MARKING");
          }
          console.log("Inferred assignment status:", assignmentStatus);
        }

      } catch (err) {
        console.error("Error fetching assignment details:", err);
        setError(err.response?.data?.message || "Failed to load assignment details");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserRole) {
      fetchAssignmentAndReport();
    }
  }, [assignmentId, teamId, navigate, currentUserRole]);

  // Export PDF function
  const exportToPDF = async () => {
    if (!assignmentDetails || !reportData) return;
    
    setIsExporting(true);
    try {
      // Create a temporary element to hold the report content for PDF generation
      const reportElement = document.createElement('div');
      reportElement.style.padding = '20px';
      reportElement.style.backgroundColor = 'white';
      
      // Add report header
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #0F172A; margin: 0; font-size: 28px;">${assignmentDetails.course_name}</h1>
          <h2 style="color: #666; margin: 5px 0 0 0; font-size: 18px; font-weight: normal;">
            ${assignmentDetails.course_code} — Semester ${assignmentDetails.semester}
          </h2>
          <p style="color: #888; margin: 10px 0 0 0; font-size: 14px;">
            Report Generated on ${new Date().toLocaleDateString()}
          </p>
        </div>
      `;
      
      // Add statistics section
      const stats = calculateReportStats();
      if (stats) {
        reportElement.innerHTML += `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0F172A; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Summary Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-top: 15px;">
              <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${stats.totalSubmissions}</div>
                <div style="font-size: 12px; color: #666;">Total Submissions</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${stats.averageScore}%</div>
                <div style="font-size: 12px; color: #666;">Average Score</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${stats.withinDeviation}</div>
                <div style="font-size: 12px; color: #666;">Within Deviation</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${stats.outsideDeviation}</div>
                <div style="font-size: 12px; color: #666;">Outside Deviation</div>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #0F172A;">${stats.flagsOpen}</div>
                <div style="font-size: 12px; color: #666;">Flags Open</div>
              </div>
            </div>
          </div>
        `;
      }
      
      // Add mark comparison table
      if (reportData.controlPapers && reportData.controlPapers.length > 0) {
        const controlPaper = reportData.controlPapers[0];
        const adminMarker = reportData.markers?.find(m => m.name?.toLowerCase().includes("admin")) || reportData.markers?.[0];
        
        let tableHTML = `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0F172A; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Mark Comparison Table</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Marker</th>
        `;
        
        reportData.rubric?.forEach(r => {
          tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: center;">${r.categoryName}</th>`;
        });
        
        tableHTML += `</tr></thead><tbody>`;
        
        // Construct scores map
        const scoresMap = {};
        controlPaper.marks?.forEach((m) => {
          scoresMap[m.markerId] = {};
          m.scores?.forEach((s) => {
            scoresMap[m.markerId][s.rubricCategoryId] = Number(s.score);
          });
        });
        
        reportData.markers?.forEach(marker => {
          if (currentUserRole !== "admin" && 
              marker.id !== adminMarker?.id && 
              marker.id !== reportData.currentUser?.id) {
            return;
          }
          
          tableHTML += `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${marker.name}${marker.id === adminMarker?.id ? ' (Admin)' : ''}</td>`;
          
          reportData.rubric?.forEach(r => {
            const score = scoresMap[marker.id]?.[r.id];
            tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${score !== undefined ? score : '-'}</td>`;
          });
          
          tableHTML += `</tr>`;
        });
        
        tableHTML += `</tbody></table></div>`;
        reportElement.innerHTML += tableHTML;
      }
      
      // Add admin comments section
      if (reportData.rubric && reportData.rubric.length > 0) {
        let commentsHTML = `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0F172A; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Rubric Coordinator Comments</h3>
        `;
        
        reportData.rubric.forEach(criterion => {
          commentsHTML += `
            <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 10px 0;">
              <h4 style="margin: 0 0 5px 0; color: #0F172A;">${criterion.categoryName}</h4>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
                Points: ${criterion.maxScore} | Deviation Threshold: ${criterion.deviationScore}
              </p>
              <div style="background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                <p style="margin: 0; color: #333;">${criterion.adminComments || 'No admin comment yet.'}</p>
              </div>
            </div>
          `;
        });
        
        commentsHTML += `</div>`;
        reportElement.innerHTML += commentsHTML;
      }
      
      // Add footer
      reportElement.innerHTML += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px;">
          Generated by Assignment Moderation System
        </div>
      `;
      
      // Use browser's print functionality to generate PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${assignmentDetails.course_name} - Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8f9fa; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${reportElement.innerHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF report");
    } finally {
      setIsExporting(false);
    }
  };

  // Update admin comment
  const updateAdminComment = async (criterionId, comment) => {
    const token = localStorage.getItem("token");
    try {
      await api.post(
        `/team/${teamId}/assignments/${assignmentId}/rubric-criteria/${criterionId}/admin-comment`,
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

  // Calculate report statistics based on backend data
  const calculateReportStats = () => {
    if (!reportData) return null;

    const { controlPapers, rubric, markers, markersAlreadyMarked } = reportData;

    // Calculate average score
    const marksArray = [];
    controlPapers?.forEach(paper => {
      paper.marks?.forEach(mark => {
        mark.scores?.forEach(score => {
          marksArray.push(Number(score.score));
        });
      });
    });

    let averageScore = 0;
    if (marksArray.length > 0) {
      const sum = marksArray.reduce((acc, val) => acc + val, 0);
      const maxPoints = rubric?.reduce((acc, r) => acc + Number(r.maxScore || 0), 0);
      averageScore = maxPoints > 0 ? (sum / marksArray.length / maxPoints) * 100 : 0;
      averageScore = Math.round(averageScore * 10) / 10;
    }

    // Calculate deviations
    const adminMarker = markers?.find(m => m.name?.toLowerCase().includes("admin")) || markers?.[0];
    let withinDeviation = 0;
    let outsideDeviation = 0;

    if (adminMarker && controlPapers?.[0]) {
      const adminMarks = {};
      controlPapers[0].marks?.find(m => m.markerId === adminMarker.id)?.scores?.forEach(s => {
        adminMarks[s.rubricCategoryId] = Number(s.score);
      });

      controlPapers[0].marks?.forEach(mark => {
        if (mark.markerId !== adminMarker.id) {
          mark.scores?.forEach(score => {
            const adminScore = adminMarks[score.rubricCategoryId];
            const thisScore = Number(score.score);
            const criterion = rubric?.find(r => r.id === score.rubricCategoryId);
            const deviationThreshold = criterion?.deviationScore || 0;

            if (adminScore !== undefined) {
              const diff = Math.abs(thisScore - adminScore);
              if (diff <= deviationThreshold) {
                withinDeviation++;
              } else {
                outsideDeviation++;
              }
            }
          });
        }
      });
    }

    const totalSubmissions = controlPapers?.length || 0;
    const totalMarkers = markers?.length || 0;
    const flagsOpen = Math.max(0, totalMarkers - markersAlreadyMarked);

    return {
      totalSubmissions,
      averageScore: isNaN(averageScore) ? 0 : averageScore,
      withinDeviation,
      outsideDeviation,
      flagsOpen
    };
  };

  if (isLoading) return <LoadingSpinner pageName="Report Details" />;

  if (error) {
    return (
      <div className="ml-56 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button
            onClick={() => navigate(`/team/${teamId}/reports`)}
            className="px-4 py-2 bg-[var(--deakinTeal)] text-white rounded hover:bg-[#0E796B] transition"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!assignmentDetails || !reportData) {
    return (
      <div className="ml-56 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">No assignment data found</div>
          <button
            onClick={() => navigate(`/team/${teamId}/reports`)}
            className="px-4 py-2 bg-[var(--deakinTeal)] text-white rounded hover:bg-[#0E796B] transition"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const reportStats = calculateReportStats();
  // 使用更宽松的状态检查
  const isCompleted = assignmentStatus?.toUpperCase() === 'COMPLETED' || 
                     (reportData.markersAlreadyMarked >= (reportData.markers?.length || 0));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar activeTab={3} />
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
          <div className="px-6 pb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="py-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  {assignmentDetails.course_name}
                  {!isCompleted && (
                    <span className="ml-2 text-sm bg-lime text-gray-800 px-2 py-1 rounded">
                      {assignmentStatus || 'MARKING'}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-zinc-600">
                  {assignmentDetails.course_code} — Semester {assignmentDetails.semester}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isCompleted && (
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0E796B] text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        Export PDF
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/team/${teamId}/reports`)}
                  className="text-[var(--deakinTeal)] hover:underline cursor-pointer"
                >
                  ← Back to list
                </button>
              </div>
            </div>

            {!isCompleted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800">
                    PDF export is only available for completed assignments. Current status: <strong>{assignmentStatus || 'MARKING'}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            {reportStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard value={reportStats.totalSubmissions} label="Total submissions" />
                <StatCard value={`${reportStats.averageScore}%`} label="Average score" />
                <StatCard value={reportStats.withinDeviation} label="Within deviation" />
                <StatCard value={reportStats.outsideDeviation} label="Outside deviation" />
                <StatCard value={reportStats.flagsOpen} label="Flags open" />
              </div>
            )}

            {/* Mark comparison table */}
            {reportData && (
              <>
                <DeviationTable
                  data={reportData}
                  currentUserRole={currentUserRole}
                />
                
                {/* Detailed mark table */}
                <DetailedMarksTable 
                  data={reportData}
                  currentUserRole={currentUserRole}
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
  const { rubric, markers, controlPapers } = data;

  if (!controlPapers || controlPapers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Mark Comparison Table
        </h3>
        <p className="text-gray-500">No control papers data available.</p>
      </div>
    );
  }

  const controlPaper = controlPapers[0];
  
  // Get admin marker
  const adminMarker = markers?.find((m) => m.name?.toLowerCase().includes("admin")) || markers?.[0];
  const adminId = adminMarker?.id;

  if (!adminId) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Mark Comparison Table
        </h3>
        <p className="text-gray-500">No admin marker found.</p>
      </div>
    );
  }

  const otherMarkers = markers
    .filter(m => m.id !== adminId)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build scores map for quick lookup
  const scoresMap = new Map();
  controlPaper.marks?.forEach((markerScores) => {
    const innerMap = new Map();
    markerScores.scores?.forEach(s => innerMap.set(s.rubricCategoryId, Number(s.score)));
    scoresMap.set(markerScores.markerId, innerMap);
  });

  const getScore = (markerId, criterionId) => {
    return scoresMap.get(markerId)?.get(criterionId);
  };


  const adminScores = scoresMap.get(adminId);
  const isAdminMarked = adminScores && adminScores.size > 0;

  return (
    <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto mb-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Marker Score Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">
                Rubric Criterion
              </th>


              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                {adminMarker.name} (Standard)
              </th>
              {otherMarkers.map(marker => {
                // tutor view: only show self and admin
                if (
                  currentUserRole !== "admin" &&
                  marker.id !== data.currentUser?.id
                ) {
                  return null;
                }

                return (
                  <th 
                    key={marker.id} 
                    className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    {marker.name}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rubric?.map(criterion => {
              const adminScore = adminScores ? getScore(adminId, criterion.id) : undefined;

              return (
                <tr key={criterion.id}>
                  <td className="px-6 py-4 whitespace-normal font-medium text-slate-900">
                    {criterion.categoryName}
                  </td>

                  {/* Admin score */}
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold bg-slate-50 text-slate-800">
                    {typeof adminScore === 'number' ? adminScore : 'N/A'}
                  </td>

                  {/* Others score */}
                  {otherMarkers.map(marker => {
                    // tutor view: only show self and admin
                    if (
                      currentUserRole !== "admin" &&
                      marker.id !== data.currentUser?.id
                    ) {
                      return null;
                    }

                    const markerScore = getScore(marker.id, criterion.id);
                    let cellColor = 'bg-white';
                    let deviationText = '';

                    if (isAdminMarked && typeof markerScore === 'number' && typeof adminScore === 'number') {
                      const difference = Math.abs(markerScore - adminScore);

                      const deviationThreshold = (criterion.deviationScore / 100) * criterion.maxScore;
                      
                      if (difference < deviationThreshold) {
                        cellColor = 'bg-green-100 text-green-900';
                        deviationText = `Within deviation (Δ${difference.toFixed(2)})`;
                      } else if (difference === deviationThreshold) {
                        cellColor = 'bg-yellow-100 text-yellow-900';
                        deviationText = `At deviation threshold (Δ${difference.toFixed(2)})`;
                      } else {
                        cellColor = 'bg-red-100 text-red-900';
                        deviationText = `Outside deviation (Δ${difference.toFixed(2)})`;
                      }
                    }

                    return (
                      <td 
                        key={marker.id} 
                        className={`px-6 py-4 whitespace-nowrap text-center font-medium ${cellColor} group relative`}
                      >
                        {typeof markerScore === 'number' ? markerScore : 'N/A'}
                        
                        {/* Tooltip for deviation details */}
                        {deviationText && (
                          <div className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                            {deviationText}
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

        {!isAdminMarked && (
          <div className="mt-4 p-3 bg-lime-100 text-deakinTeal rounded-md text-sm">
            The standard marker has not yet marked this control paper. Score coloring is disabled until the standard is set.
          </div>
        )}

       
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-300 mr-1"></div>
            <span>Within deviation threshold</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 mr-1"></div>
            <span>At deviation threshold</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 mr-1"></div>
            <span>Outside deviation threshold</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// DetailedMarksTable component
function DetailedMarksTable({ data, currentUserRole }) {
  const [expandedComments, setExpandedComments] = useState({});
  const { controlPapers, rubric, markers } = data;

  if (!controlPapers || controlPapers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Detailed Marks with Comments
        </h3>
        <p className="text-gray-500">No detailed marks data available.</p>
      </div>
    );
  }

  // Get admin marker
  const adminMarker = markers?.find(m => m.name?.toLowerCase().includes("admin")) || markers?.[0];

  // Expand/collapse comment
  const toggleComment = (markId) => {
    setExpandedComments(prev => ({
      ...prev,
      [markId]: !prev[markId]
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Detailed Marks with Comments
      </h3>
      
      {/* Group by markers */}
      {markers?.map(marker => {
        // tutor view: only show self and admin
        if (currentUserRole !== "admin" && 
            marker.id !== adminMarker?.id && 
            marker.id !== data.currentUser?.id) {
          return null;
        }

        return (
          <div key={marker.id} className="mb-8 border border-gray-200 rounded-lg">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h4 className="font-semibold text-lg text-slate-800">
                Marker: {marker.name}
                {marker.id === adminMarker?.id && (
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
                    <th className="p-3 border-r font-medium">Deviation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rubric?.map(criterion => {
                    // Find this marker's score for this criterion
                    const controlPaper = controlPapers[0];
                    const markerMarks = controlPaper.marks?.find(m => m.markerId === marker.id);
                    const scoreObj = markerMarks?.scores?.find(s => s.rubricCategoryId === criterion.id);
                    
                    if (!scoreObj) return null;

                    // Calculate deviation
                    const adminMarks = controlPaper.marks?.find(m => m.markerId === adminMarker?.id);
                    const adminScoreObj = adminMarks?.scores?.find(s => s.rubricCategoryId === criterion.id);
                    
                    let deviationStatus = 'bg-gray-100';
                    let deviationText = 'N/A';

                    if (adminScoreObj && marker.id !== adminMarker?.id) {
                      const thisScore = Number(scoreObj.score);
                      const adminScore = Number(adminScoreObj.score);
                      const diff = Math.abs(thisScore - adminScore);
                      
                      if (diff === 0) {
                        deviationStatus = 'bg-green-100 text-green-800';
                        deviationText = 'Exact match';
                      } else if (diff <= criterion.deviationScore) {
                        deviationStatus = 'bg-yellow-100 text-yellow-800';
                        deviationText = `Within deviation (Δ${diff.toFixed(2)})`;
                      } else {
                        deviationStatus = 'bg-red-100 text-red-800';
                        deviationText = `Outside deviation (Δ${diff.toFixed(2)})`;
                      }
                    }

                    return (
                      <tr key={`${marker.id}-${criterion.id}`} className="border-t">
                        <td className="p-3 border-r font-medium text-slate-700">
                          {criterion.categoryName}
                        </td>
                        <td className="p-3 border-r text-center">
                          <span className="font-semibold">
                            {scoreObj.score} / {criterion.maxScore}
                          </span>
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
          Rubric Coordinator Comments
        </h3>
        <p className="text-gray-500">No rubric criteria available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Rubric Coordinator Comments
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