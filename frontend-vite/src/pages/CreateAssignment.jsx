import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../utils/axios";

// SHADCN & DATE-DNS IMPORTS
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
  const [step, setStep] = useState(1);

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

  // --- TEAM MEMBERS STATE ---
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // FETCH TEAM MEMBERS
  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get(`/team/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(res.data.members || []);
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [teamId]);

  // MARKER HELPER FUNCTIONS
  const addMarker = (member) => { if (!markers.find((m) => m.id === member.id)) { setMarkers([...markers, member]); } };
  const removeMarker = (id) => { setMarkers(markers.filter((m) => m.id !== id)); };
  const availableMembers = teamMembers.filter( (member) => !markers.find((m) => m.id === member.id) );

  // --- RUBRIC STATE & FUNCTIONS (Step 2) ---
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
    
    setRubric(rubric.map((c) => {
      if (c.id === criterionId) {
        return { ...c, points: newPoints, tiers: generateTiersWithPercentages(newPoints) };
      }
      return c;
    }));
  };

  const updateDeviation = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, deviation: parseFloat(value) || 0 } : c)));
  
  const addCriterion = () => { setRubric([ ...rubric, { id: crypto.randomUUID(), criteria: "", tiers: generateTiersWithPercentages(20), points: 20, deviation: 0, }, ]); };

  const updateTierLowerBound = (criterionId, tierIndex, newLowerBoundStr) => {
    const value = parseFloat(newLowerBoundStr);

    setRubric(currentRubric => {
        const newRubric = JSON.parse(JSON.stringify(currentRubric)); // Deep copy
        const criterion = newRubric.find(c => c.id === criterionId);
        if (!criterion) return currentRubric;

        const tiers = criterion.tiers;
        const totalPoints = criterion.points;

        if (isNaN(value) || value < 0) return currentRubric;
        if (value > totalPoints) return currentRubric; 
        if (tierIndex > 0 && value >= tiers[tierIndex - 1].lowerBound) return currentRubric;
        if (tierIndex < tiers.length - 2 && value <= tiers[tierIndex + 1].lowerBound) return currentRubric;

        tiers[tierIndex].lowerBound = value;
        if (tierIndex < tiers.length - 1) {
            tiers[tierIndex + 1].upperBound = value - 0.5;
        }

        return newRubric;
    });
  };

  const deleteRow = (criterionId) => setRubric(rubric.filter((c) => c.id !== criterionId));
  
  const handleRightClick = (e, criterionId) => { 
    e.preventDefault(); 
    setContextMenu({ x: e.pageX, y: e.pageY, criterionId }); 
  };
  
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

  // Validation and step handling logic
  const handleNextStep = () => {
    if (step === 1) {
        if (!assignmentDetails.courseCode || !assignmentDetails.courseName || !assignmentDetails.semester || !assignmentDetails.dueDate) {
            alert("Please fill out all assignment details.");
            return;
        }
        if (markers.length === 0) {
            alert("Please add at least one marker.");
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
    }
  };

  const handleCreate = () => {
    alert("Assignment Created! (Simulation)");
    console.log("Final Assignment Data:", {
        details: assignmentDetails,
        markers: markers,
        rubric: rubric,
    });
  };

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        <Navbar />
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
                            className="text-zinc-600 text-[8px] font-normal underline cursor-pointer"
                            onClick={() => removeMarker(marker.id)}
                            >
                            Remove
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
                            No team members available.
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
                                  <div className="text-bg-[#0F172A] text-base font-medium truncate">{marker.username}</div>
                              </div>
                          </div>
                      ))}
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
                {step < 3 && (
                    <button 
                        className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800" 
                        onClick={handleNextStep}>
                        {step === 1 ? 'Next' : 'Review'}
                    </button>
                )}
                {step === 3 && (
                    <button 
                        className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800"
                        onClick={handleCreate}>
                        Create
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}