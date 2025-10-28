import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";

export default function ReportPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reportStats, setReportStats] = useState(null);
  const [reportData, setReportData] = useState(null);

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

  //  obtain completed assignments list
  useEffect(() => {
    const fetchAssignments = async () => {
      if (currentUserRole !== "admin") return;
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      setIsLoading(true);
      try {
        const res = await api.get(`/team/${teamId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const completed = (res.data.assignments || []).filter(
          (a) => a.status?.toLowerCase() === "completed"
        );
        setCompletedAssignments(completed);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [teamId, currentUserRole, navigate]);

  //  get selected assignment details & compute stats
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

        // avg score calculation
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

        // Wrap up stats
        const totalSubmissions = data.controlPapers?.length || 0;
        const markers = data.markers?.length || 0;
        const markersCompleted = data.markersAlreadyMarked || 0;
        const withinDeviation =
          data.rubric?.filter((r) => r.deviationScore <= 10)?.length || 0;

        setReportStats({
          totalSubmissions,
          averageScore: isNaN(averageScore) ? 0 : averageScore,
          withinDeviation,
          outsideDeviation:
            (data.rubric?.length || 0) - withinDeviation,
          flagsOpen: Math.max(0, markers - markersCompleted),
        });

        setReportData(data);
      } catch (err) {
        console.error("Error fetching assignment details:", err);
      }
    };
    fetchDetails();
  }, [selectedAssignment, teamId]);

  // Loading
  if (isLoading)
    return (
      <div className="ml-56 flex justify-center items-center h-screen">
        Loading reports...
      </div>
    );

  // Access Control
  /*
  if (currentUserRole !== "admin" && !selectedAssignment) {
    return (
      <div className="ml-56 flex justify-center items-center h-screen text-lg font-semibold">
        Access denied. Admins only.
      </div>
    );
  }*/

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
          {!selectedAssignment && (
            <div className="px-6 pb-8">
              <h2 className="text-lg font-semibold mb-4 text-zinc-700">
                Completed Assignments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedAssignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className="bg-white p-4 rounded-2xl shadow hover:shadow-md cursor-pointer transition"
                  >
                    <div className="font-semibold text-lg text-slate-800">
                      {a.course_name}
                    </div>
                    <div className="text-sm text-zinc-600">
                      {a.course_code} — Semester {a.semester}
                    </div>
                    <div className="mt-2 text-[var(--deakinTeal)] font-medium">
                      View Report →
                    </div>
                  </div>
                ))}
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

              {/* 对比分数表格 */}
              {reportData && (
                <DeviationTable
                  data={reportData}
                  currentUserRole={currentUserRole}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 小组件：统计卡片
function StatCard({ value, label }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-zinc-600">{label}</p>
    </div>
  );
}

// 小组件：对比分数表格
function DeviationTable({ data, currentUserRole }) {
  const rubric = data.rubric || [];
  const markers = data.markers || [];
  const papers = data.controlPapers || [];

  const controlPaper = papers[0];
  if (!controlPaper) return null;

  // 构建 markerId -> criterion -> score 映射
  const scoresMap = {};
  controlPaper.marks.forEach((m) => {
    scoresMap[m.markerId] = {};
    m.scores.forEach((s) => {
      scoresMap[m.markerId][s.rubricCategoryId] = Number(s.score);
    });
  });

  // 找出 admin (假设第一位或名字中含 admin)
  const adminMarker =
    markers.find((m) => m.name?.toLowerCase().includes("admin")) || markers[0];
  const adminId = adminMarker.id;

  return (
    <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
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
            // tutor 视图：只显示自己 + admin
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
                      bg = "bg-blue-200";
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
