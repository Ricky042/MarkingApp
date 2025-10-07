import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import api from "../utils/axios";

// SHADCN & DATE-DNS IMPORTS
import { format } from "date-fns";
import { Calendar as CalendarIcon, UploadCloud, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Helper component for auto-expanding textareas
const AutoTextarea = ({ value, onChange, placeholder, onContextMenu }) => {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onContextMenu={onContextMenu}
      placeholder={placeholder}
      className="w-full h-full bg-transparent resize-none focus:outline-none text-black text-xs font-normal font-['Inter'] leading-normal p-3"
      rows={4}
    />
  );
};

// Helper function to round to the nearest 0.5
const roundToHalf = (num) => Math.round(num * 2) / 2;

// Generates tiers based on standard academic percentages of a total
const generateTiersWithPercentages = (points) => {
    const percentages = { hd: 0.85, d: 0.75, c: 0.65, p: 0.50 };
    return [
        { id: crypto.randomUUID(), name: 'High Distinction', description: "", lowerBound: roundToHalf(points * percentages.hd), upperBound: points },
        { id: crypto.randomUUID(), name: 'Distinction', description: "", lowerBound: roundToHalf(points * percentages.d), upperBound: roundToHalf(points * percentages.hd) - 0.5 },
        { id: crypto.randomUUID(), name: 'Credit', description: "", lowerBound: roundToHalf(points * percentages.c), upperBound: roundToHalf(points * percentages.d) - 0.5 },
        { id: crypto.randomUUID(), name: 'Pass', description: "", lowerBound: roundToHalf(points * percentages.p), upperBound: roundToHalf(points * percentages.c) - 0.5 },
        { id: crypto.randomUUID(), name: 'Fail', description: "", lowerBound: 0, upperBound: roundToHalf(points * percentages.p) - 0.5 },
    ];
};

export default function CreateAssignment() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- STEP 1: ASSIGNMENT DETAILS STATE ---
  const [assignmentDetails, setAssignmentDetails] = useState({
    courseCode: "",
    courseName: "",
    semester: "",
    dueDate: undefined,
  });

  const handleDetailsChange = (field, value) => {
    setAssignmentDetails((prev) => ({ ...prev, [field]: value }));
  };

  // --- MARKER STATE ---
  const [markers, setMarkers] = useState([]);
  const [showMarkerList, setShowMarkerList] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // FETCH CURRENT USER AND TEAM MEMBERS
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        setLoadingMembers(false);
        navigate("/login");
        return;
      }

      try {
        const localUser = JSON.parse(userStr);
        const userRes = await api.get(`/users/${localUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(userRes.data);

        const teamRes = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(teamRes.data.members || []);
      } catch (err) {
        console.error("Failed to load user or team members:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchUserData();
  }, [teamId, navigate]);

  useEffect(() => {
    if (currentUser) {
      setMarkers(prevMarkers => {
        if (!prevMarkers.some(m => m.id === currentUser.id)) {
          return [...prevMarkers, currentUser];
        }
        return prevMarkers;
      });
    }
  }, [currentUser]);

  const [teamMembers, setTeamMembers] = useState([]);
  const addMarker = (member) => { if (!markers.find((m) => m.id === member.id)) { setMarkers([...markers, member]); } };
  const removeMarker = (id) => { 
    if (currentUser && String(id) === String(currentUser.id)) {
        alert("The assignment creator cannot be removed as a marker.");
        return;
    }
    setMarkers(markers.filter((m) => String(m.id) !== String(id)));
  };
  const availableMembers = teamMembers.filter( (member) => 
    !markers.find((m) => String(m.id) === String(member.id)) &&
    (currentUser ? String(member.id) !== String(currentUser.id) : true)
  );

  // --- STEP 2: RUBRIC STATE & FUNCTIONS ---
  const [rubric, setRubric] = useState([ { id: crypto.randomUUID(), criteria: "", tiers: generateTiersWithPercentages(20), points: 20, deviation: 0, }, ]);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const updateCriterionText = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, criteria: value } : c)));
  const updateTierDescription = (criterionId, tierIndex, value) => {
    setRubric(rubric.map((c) => {
      if (c.id === criterionId) {
        const newTiers = c.tiers.map((t, i) => (i === tierIndex ? { ...t, description: value } : t));
        return { ...c, tiers: newTiers };
      }
      return c;
    }));
  };
  const updatePoints = (criterionId, value) => {
    const newPoints = parseFloat(value);
    if (isNaN(newPoints) || newPoints < 0) return;
    setRubric(rubric.map((c) => c.id === criterionId ? { ...c, points: newPoints, tiers: generateTiersWithPercentages(newPoints) } : c));
  };
  const updateDeviation = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, deviation: parseFloat(value) || 0 } : c)));
  const addCriterion = () => setRubric([ ...rubric, { id: crypto.randomUUID(), criteria: "", tiers: generateTiersWithPercentages(20), points: 20, deviation: 0, }, ]);
  const updateTierLowerBound = (criterionId, tierIndex, newLowerBoundStr) => {
    const value = parseFloat(newLowerBoundStr);
    setRubric(currentRubric => {
        const newRubric = JSON.parse(JSON.stringify(currentRubric));
        const criterion = newRubric.find(c => c.id === criterionId);
        if (!criterion) return currentRubric;
        const tiers = criterion.tiers;
        const totalPoints = criterion.points;
        if (isNaN(value) || value < 0 || value > totalPoints || (tierIndex > 0 && value >= tiers[tierIndex - 1].lowerBound) || (tierIndex < tiers.length - 2 && value <= tiers[tierIndex + 1].lowerBound)) return currentRubric;
        tiers[tierIndex].lowerBound = value;
        if (tierIndex < tiers.length - 1) {
            tiers[tierIndex + 1].upperBound = value - 0.5;
        }
        return newRubric;
    });
  };
  const deleteRow = (criterionId) => setRubric(rubric.filter((c) => c.id !== criterionId));
  const handleRightClick = (e, criterionId) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, criterionId }); };
  const handleContextMenuAction = (action) => {
    if (!contextMenu) return;
    const { criterionId } = contextMenu;
    if (action === "delete-row") {
      if (rubric.length <= 1) {
        alert("You cannot delete the last criterion.");
      } else {
        deleteRow(criterionId);
      }
    }
    setContextMenu(null);
  };

  // --- STEP 3: CONTROL PAPERS STATE ---
  const [controlPaperA, setControlPaperA] = useState(null);
  const [controlPaperB, setControlPaperB] = useState(null);

  // --- Navigation and Submission Logic ---
  const handleNextStep = () => {
    if (step === 1) {
        if (!assignmentDetails.courseCode || !assignmentDetails.courseName || !assignmentDetails.semester || !assignmentDetails.dueDate) {
            alert("Please fill out all assignment details.");
            return;
        }
        setStep(2);
    } else if (step === 2) {
        for (const criterion of rubric) {
            if (criterion.criteria.trim() === "") {
                alert("Please fill out all 'Criteria' descriptions in the rubric.");
                return;
            }
            for (const tier of criterion.tiers) {
                if (tier.description.trim() === "") {
                    alert(`Please fill out the description for '${tier.name}' in the rubric.`);
                    return;
                }
            }
        }
        setStep(3);
    } else if (step === 3) {
      if (!controlPaperA || !controlPaperB) {
        alert("Please upload both Control Paper A and Control Paper B before proceeding.");
        return;
      }
      setStep(4);
    }
  };

  const handleCreate = async () => {
    if (!controlPaperA || !controlPaperB) {
      alert("Both control papers are required. Please go back and upload them.");
      return;
    }

    const formData = new FormData();
    formData.append('controlPaperA', controlPaperA);
    formData.append('controlPaperB', controlPaperB);

    const payload = {
      assignmentDetails: { ...assignmentDetails, teamId: teamId },
      markers: markers.map(marker => marker.id),
      rubric: rubric,
    };
    formData.append('assignmentData', JSON.stringify(payload));

    try {
      const response = await api.post('/assignments', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 201) {
        alert("Assignment created successfully!");
        navigate(`/team/${teamId}/dashboard`);
      } else {
        alert(`An issue occurred: ${response.data.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      const errorMessage = error.response?.data?.message || "An error occurred while creating the assignment.";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-neutral-100 min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>
      <div className="ml-56 flex flex-col min-h-screen">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)}/>
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-56" : "mr-0"}`}>
        <div className="px-6 py-6 flex-1 overflow-auto">
            {step === 1 && (
                <>
                {/* Header */}
                <div className="w-72 justify-start mb-6">
                    <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">
                    Create New Assignment/<br />
                    </span>
                    <span className="text-bg-[#0F172A] text-2xl font-medium leading-7">
                    Assignment Info<br />
                    </span>
                </div>

                {/* Assignment Info Inputs */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        {/* Course Code */}
                        <div className="flex flex-col">
                        <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                            Course Code
                        </div>
                        <input
                            type="text"
                            className="w-72 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter course code"
                            value={assignmentDetails.courseCode}
                            onChange={(e) =>
                            handleDetailsChange("courseCode", e.target.value)
                            }
                        />
                        </div>

                        {/* Course Name */}
                        <div className="flex flex-col">
                        <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                            Course Name
                        </div>
                        <input
                            type="text"
                            className="w-72 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter course name"
                            value={assignmentDetails.courseName}
                            onChange={(e) =>
                            handleDetailsChange("courseName", e.target.value)
                            }
                        />
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col">
                        <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                        Due Date
                        </div>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !assignmentDetails.dueDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {assignmentDetails.dueDate ? (
                                format(assignmentDetails.dueDate, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={assignmentDetails.dueDate}
                            onSelect={(date) => handleDetailsChange("dueDate", date)}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                    </div>

                    {/* Semester */}
                    <div className="flex flex-col">
                        <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                        Semester
                        </div>
                        <div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center">
                        <span className="flex-1 text-zinc-600 text-sm font-normal">
                            {assignmentDetails.semester
                            ? `Semester ${assignmentDetails.semester}`
                            : "Select semester"}
                        </span>
                        <img
                            src="/CreateAssignment/icon/chevron-down.svg"
                            alt="Dropdown arrow"
                            className="w-4 h-4"
                        />
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={assignmentDetails.semester}
                            onChange={(e) =>
                            handleDetailsChange("semester", e.target.value)
                            }
                        >
                            <option value="" disabled>
                            Select semester
                            </option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                        </select>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Markers */}
                <div className="flex flex-col gap-2 mt-6">
                    <div className="text-bg-[#0F172A] text-base font-semibold mb-2">
                    Markers
                    </div>

                    {/* Marker Cards */}
                    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-300 min-h-[360px] w-245">
                    {markers.map((marker) => (
                        <div
                        key={marker.id}
                        className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md outline outline-[0.67px] outline-offset-[-0.67px] outline-slate-300 flex flex-col justify-start gap-2"
                        >
                        <div className="flex justify-between items-start">
                            <div className="text-zinc-600 text-[8px] font-semibold">
                            {marker.id}
                            </div>
                            <div
                            className={`text-zinc-600 text-[8px] font-normal underline ${currentUser && String(marker.id) === String(currentUser.id) ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}
                            onClick={() => removeMarker(marker.id)}
                            >
                            {currentUser && String(marker.id) === String(currentUser.id) ? 'Creator (Cannot Remove)' : 'Remove'}
                            </div>
                        </div>
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                            <div className="text-bg-[#0F172A] text-base font-medium truncate">
                            {marker.username}
                            </div>
                        </div>
                        </div>
                    ))}

                    {/* Add Marker Button */}
                    <div
                        className="w-56 h-28 px-4 pt-2.5 pb-1.5 bg-slate-50 rounded-md outline outline-1 outline-offset-[-0.67px] outline-slate-300 flex justify-center items-center cursor-pointer hover:bg-slate-100 transition"
                        onClick={() => setShowMarkerList(!showMarkerList)}
                    >
                        <div className="text-3xl font-bold text-zinc-600">+</div>
                    </div>
                    </div>

                    {/* Marker List Dropdown */}
                    {showMarkerList && (
                    <div className="mt-3 flex flex-col gap-2 p-3 bg-white rounded-md outline outline-1 outline-slate-300 w-full">
                        {loadingMembers ? (
                        <div>Loading team members...</div>
                        ) : availableMembers.length === 0 ? (
                        <div className="text-sm text-zinc-600">
                            No other team members available to add.
                        </div>
                        ) : (
                        availableMembers.map((member) => (
                            <div
                            key={member.id}
                            className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-md"
                            >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                                <div className="text-sm font-medium truncate">
                                {member.username}
                                </div>
                            </div>
                            <button
                                className="px-2 py-1 bg-blue-500 text-white rounded-md"
                                onClick={() => addMarker(member)}
                            >
                                +
                            </button>
                            </div>
                        ))
                        )}

                        <div className="text-right mt-2">
                        <button
                            className="text-zinc-600 underline text-sm"
                            onClick={() => setShowMarkerList(false)}
                        >
                            Close
                        </button>
                        </div>
                    </div>
                    )}
                </div>
                </>
            )}

            {step === 2 && (
             <div className="w-full mb-6">
              <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">Create New Assignment/<br /></span><span className="text-bg-[#0F172A] text-2xl font-medium leading-7">Rubric Setup<br /></span>
              <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Assignment Criteria</div>
            
              <div className="w-full flex flex-col">
                {/* Header Row */}
                <div className="flex bg-black/5 rounded-t-lg border border-zinc-400 border-b-0">
                  <div className="p-3" style={{ flexBasis: '12%' }}><div className="text-black text-xs font-semibold">Criteria</div></div>
                  <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">High Distinction</div></div>
                  <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Distinction</div></div>
                  <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Credit</div></div>
                  <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Pass</div></div>
                  <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Fail</div></div>
                  <div className="p-3 border-l border-zinc-400" style={{ flexBasis: '8%' }}><div className="text-black text-xs font-semibold">Pts</div></div>
                  <div className="p-3 border-l border-zinc-400" style={{ flexBasis: '12%' }}><div className="text-black text-xs font-semibold">Deviation</div></div>
                </div>

                {/* Dynamic Data Rows */}
                {rubric.map((criterion) => (
                  <div className="flex bg-white border-l border-r border-b border-zinc-400 last:rounded-b-lg" key={criterion.id}>
                    <div className="flex" style={{ flexBasis: '12%' }} onContextMenu={(e) => handleRightClick(e, criterion.id)}>
                      <AutoTextarea value={criterion.criteria} onChange={(e) => updateCriterionText(criterion.id, e.target.value)} placeholder="Criterion..."/>
                    </div>
                    
                    {criterion.tiers.map((tier, tierIndex) => (
                        <div key={tier.id} className="border-l border-zinc-400 flex flex-col justify-between bg-white/40 min-w-[120px] min-h-[120px]" style={{ flex: 1 }} onContextMenu={(e) => handleRightClick(e, criterion.id)}>
                            <AutoTextarea value={tier.description} onChange={(e) => updateTierDescription(criterion.id, tierIndex, e.target.value)} placeholder={`Describe ${tier.name}...`}/>
                            <div className="flex items-center justify-center p-1 bg-slate-50 border-t border-zinc-300">
                                <input 
                                    type="number" 
                                    step="0.5"
                                    value={tier.lowerBound} 
                                    onChange={(e) => updateTierLowerBound(criterion.id, tierIndex, e.target.value)}
                                    className="w-12 text-center text-xs bg-transparent focus:outline-none"
                                    disabled={tierIndex === criterion.tiers.length - 1}
                                />
                                <span className="text-xs mx-1">-</span>
                                <span className="w-12 text-center text-xs">{tier.upperBound}</span>
                            </div>
                        </div>
                    ))}
                    
                    <div className="border-l border-zinc-400 relative flex items-center justify-center p-2" style={{ flexBasis: '8%' }} onContextMenu={(e) => handleRightClick(e, criterion.id)}>
                      <input type="number" step="0.5" value={criterion.points} onChange={(e) => updatePoints(criterion.id, e.target.value)} className="w-full text-center bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] text-xs p-2" placeholder="Pts"/>
                    </div>

                    <div className="border-l border-zinc-400 flex items-center justify-center p-2" style={{ flexBasis: '12%' }} onContextMenu={(e) => handleRightClick(e, criterion.id)}>
                      <div className="w-full flex items-center gap-1 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] p-2">
                        <span className="text-[#0F172A] font-normal">±</span>
                        <input type="number" step="0.5" value={criterion.deviation} onChange={(e) => updateDeviation(criterion.id, e.target.value)} className="w-full text-center text-xs" placeholder="Dev"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-36 h-12 bg-slate-50 border border-zinc-400 rounded-lg flex justify-center items-center mt-5 cursor-pointer hover:bg-slate-100" onClick={addCriterion} title="Add New Criterion Row"><div className="w-8 h-8 relative"><img src="/CreateAssignment/icon/plus.svg" alt="plus sign" className="w-full h-full" /></div></div>
              
              {contextMenu && (
                <div className="absolute bg-white border rounded shadow-lg z-10" style={{ top: contextMenu.y, left: contextMenu.x }}>
                  <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600" onClick={() => handleContextMenuAction('delete-row')}>Delete this Criterion Row</div>
                </div>
              )}
            </div>
          )}

            {step === 3 && (
              <div className="w-full mb-6">
                {/* Header */}
                <div className="w-full justify-start mb-6">
                  <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">Create New Assignment/<br /></span>
                  <span className="text-bg-[#0F172A] text-2xl font-medium leading-7">Control Paper Uploads<br /></span>
                </div>
                <p className="text-slate-600 mb-8">Upload the two control papers for this assignment. These will be used to standardise marking across all assigned tutors.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Uploader for Control Paper A */}
                  <div className="flex flex-col gap-2">
                    <label className="text-bg-[#0F172A] text-base font-semibold">Control Paper A</label>
                    {controlPaperA ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <File className="w-6 h-6 text-blue-600"/>
                          <span className="text-sm font-medium text-slate-800">{controlPaperA.name}</span>
                        </div>
                        <button onClick={() => setControlPaperA(null)} className="p-1 rounded-full hover:bg-slate-100">
                          <X className="w-4 h-4 text-slate-500"/>
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="file-upload-A" className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-10 h-10 mb-3 text-slate-400"/>
                              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-slate-500">PDF, DOCX, etc.</p>
                          </div>
                          <input id="file-upload-A" type="file" className="absolute inset-0 w-full h-full opacity-0" onChange={(e) => setControlPaperA(e.target.files[0])} />
                      </label>
                    )}
                  </div>

                  {/* Uploader for Control Paper B */}
                  <div className="flex flex-col gap-2">
                    <label className="text-bg-[#0F172A] text-base font-semibold">Control Paper B</label>
                    {controlPaperB ? (
                       <div className="p-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <File className="w-6 h-6 text-green-600"/>
                           <span className="text-sm font-medium text-slate-800">{controlPaperB.name}</span>
                         </div>
                         <button onClick={() => setControlPaperB(null)} className="p-1 rounded-full hover:bg-slate-100">
                           <X className="w-4 h-4 text-slate-500"/>
                         </button>
                       </div>
                    ) : (
                      <label htmlFor="file-upload-B" className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-10 h-10 mb-3 text-slate-400"/>
                              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-slate-500">PDF, DOCX, etc.</p>
                          </div>
                          <input id="file-upload-B" type="file" className="absolute inset-0 w-full h-full opacity-0" onChange={(e) => setControlPaperB(e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
                 <div className="w-full mb-6">
                    {/* Header */}
                    <div className="w-72 justify-start mb-6">
                        <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">Create New Assignment/<br /></span>
                        <span className="text-bg-[#0F172A] text-2xl font-medium leading-7">Review & Create<br /></span>
                    </div>

                    {/* Assignment Details Review */}
                    <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-2 pb-4">Assignment Information</div>
                    <div className="p-4 bg-white rounded-lg border border-slate-300 grid grid-cols-2 gap-x-6 gap-y-4">
                        <div><span className="font-semibold">Course Code:</span> {assignmentDetails.courseCode}</div>
                        <div><span className="font-semibold">Course Name:</span> {assignmentDetails.courseName}</div>
                        <div><span className="font-semibold">Semester:</span> Semester {assignmentDetails.semester}</div>
                        <div><span className="font-semibold">Due Date:</span> {assignmentDetails.dueDate ? format(assignmentDetails.dueDate, "PPP") : 'N/A'}</div>
                    </div>

                    {/* Markers Review */}
                    <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Assigned Markers</div>
                    <div className="flex flex-wrap gap-2">
                      {markers.map((marker) => (
                          <div key={marker.id} className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md outline outline-[0.67px] outline-offset-[-0.67px] outline-slate-300 flex flex-col justify-start gap-2">
                              <div className="flex justify-between items-start">
                                  <div className="text-zinc-600 text-[8px] font-semibold">{marker.id}</div>
                              </div>
                              <div className="flex items-center gap-3.5">
                                  <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                                  <div className="text-bg-[#0F172A] text-base font-medium truncate">
                                    {marker.username} {currentUser && String(marker.id) === String(currentUser.id) && '(Creator)'}
                                  </div>
                              </div>
                          </div>
                      ))}
                    </div>

                    {/* Control Papers Review */}
                    <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Control Papers</div>
                    <div className="p-4 bg-white rounded-lg border border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-blue-600"/>
                        <div>
                          <p className="font-semibold text-sm">Control Paper A</p>
                          <p className="text-xs text-slate-600">{controlPaperA?.name || 'No file selected'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-green-600"/>
                        <div>
                          <p className="font-semibold text-sm">Control Paper B</p>
                          <p className="text-xs text-slate-600">{controlPaperB?.name || 'No file selected'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rubric Review */}
                    <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Final Rubric</div>
                    <div className="w-full flex flex-col">
                        {/* Header Row */}
                        <div className="flex bg-black/5 rounded-t-lg border border-zinc-400 border-b-0">
                          <div className="p-3" style={{ flexBasis: '12%' }}><div className="text-black text-xs font-semibold">Criteria</div></div>
                          <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">High Distinction</div></div>
                          <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Distinction</div></div>
                          <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Credit</div></div>
                          <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Pass</div></div>
                          <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}><div className="text-black text-xs font-semibold">Fail</div></div>
                          <div className="p-3 border-l border-zinc-400" style={{ flexBasis: '8%' }}><div className="text-black text-xs font-semibold">Pts</div></div>
                          <div className="p-3 border-l border-zinc-400" style={{ flexBasis: '12%' }}><div className="text-black text-xs font-semibold">Deviation</div></div>
                        </div>

                        {/* Data Rows */}
                        {rubric.map((criterion) => (
                          <div className="flex bg-white border-l border-r border-b border-zinc-400 last:rounded-b-lg" key={criterion.id}>
                            <div className="p-3" style={{ flexBasis: '12%' }}><p className="text-xs">{criterion.criteria}</p></div>
                            {criterion.tiers.map((tier) => (
                                <div key={tier.id} className="border-l border-zinc-400 flex flex-col justify-between min-w-[120px]" style={{ flex: 1 }}>
                                    <p className="text-xs p-3">{tier.description}</p>
                                    <div className="flex items-center justify-center p-1 bg-slate-50 border-t border-zinc-300">
                                        <span className="w-12 text-center text-xs">{tier.lowerBound}</span>
                                        <span className="text-xs mx-1">-</span>
                                        <span className="w-12 text-center text-xs">{tier.upperBound}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="border-l border-zinc-400 flex items-center justify-center p-2" style={{ flexBasis: '8%' }}><p className="text-xs">{criterion.points}</p></div>
                            <div className="border-l border-zinc-400 flex items-center justify-center p-2" style={{ flexBasis: '12%' }}><p className="text-xs">± {criterion.deviation}</p></div>
                          </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-4 px-6 mt-8">
                {step > 1 && (
                    <button 
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50" 
                        onClick={() => setStep(step - 1)}>
                        Back
                    </button>
                )}
                {step < 4 && (
                    <button 
                        className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800" 
                        onClick={handleNextStep}>
                        {step === 3 ? 'Review' : 'Next'}
                    </button>
                )}
                {step === 4 && (
                    <button 
                        className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800"
                        onClick={handleCreate}>
                        Create Assignment
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
    </div>
  );
}