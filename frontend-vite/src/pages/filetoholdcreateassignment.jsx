import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../utils/axios";

// SHADCN & DATE-FNS IMPORTS
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
      rows={1}
    />
  );
};


export default function CreateAssignment() {
  const { teamId } = useParams();
  const [step, setStep] = useState(1);

  // --- STEP 1: ASSIGNMENT DETAILS STATE ---
  const [assignmentDetails, setAssignmentDetails] = useState({ courseCode: "", courseName: "", semester: "", dueDate: undefined, });
  const handleDetailsChange = (field, value) => { setAssignmentDetails((prev) => ({ ...prev, [field]: value })); };

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
        const res = await api.get(`/team/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` }, });
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
  const [rubric, setRubric] = useState([ { id: crypto.randomUUID(), criteria: "", tiers: [{ id: crypto.randomUUID(), value: "" }, { id: crypto.randomUUID(), value: "" }], points: 20, deviation: 2, }, ]);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const updateCriterionText = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, criteria: value } : c)));
  const updateTierText = (criterionId, tierIndex, value) => setRubric(rubric.map((c) => c.id === criterionId ? { ...c, tiers: c.tiers.map((t, i) => (i === tierIndex ? { ...t, value } : t)), } : c));
  const updatePoints = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, points: Number(value) } : c)));
  const updateDeviation = (criterionId, value) => setRubric(rubric.map((c) => (c.id === criterionId ? { ...c, deviation: Number(value) } : c)));
  
  const addCriterion = () => { setRubric([ ...rubric, { id: crypto.randomUUID(), criteria: "", tiers: [{ id: crypto.randomUUID(), value: "" }], points: 0, deviation: 0, }, ]); };
  const addRatingTier = (criterionId) => { setRubric(rubric.map(c => c.id === criterionId ? { ...c, tiers: [...c.tiers, { id: crypto.randomUUID(), value: "" }] } : c )); };
  const deleteTier = (criterionId, tierIndex) => { setRubric(rubric.map((c) => c.id === criterionId ? { ...c, tiers: c.tiers.filter((_, i) => i !== tierIndex) } : c )); };
  const deleteColumn = (tierIndex) => setRubric(rubric.map((c) => ({ ...c, tiers: c.tiers.filter((_, i) => i !== tierIndex) })));
  const deleteRow = (criterionId) => setRubric(rubric.filter((c) => c.id !== criterionId));
  const handleRightClick = (e, type, criterionId, tierIndex = null) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, type, criterionId, tierIndex, }); };
  
  const handleContextMenuAction = (action) => {
    if (!contextMenu) return;
    const { type, criterionId, tierIndex } = contextMenu;
    if (action === "delete-row") { if (rubric.length <= 1) { alert("You cannot delete the last criterion."); } else { deleteRow(criterionId); } }
    if (action === "delete-box" && type === "rating") { const criterion = rubric.find(c => c.id === criterionId); if (criterion && criterion.tiers.length <= 1) { alert("Each criterion must have at least one rating box."); } else { deleteTier(criterionId, tierIndex); } }
    if (action === "delete-column" && type === "rating") { const canDelete = rubric.every(c => c.tiers.length > 1 || c.tiers.length <= tierIndex); if (!canDelete) { alert("You cannot delete this column as it would leave a criterion with no rating boxes."); } else { deleteColumn(tierIndex); } }
    setContextMenu(null);
  };

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        <Navbar />
        <div className="px-6 py-6 flex-1 overflow-auto">
          {step === 1 && (
            <>
              {/* Your Step 1 JSX remains unchanged */}
              <div className="w-72 justify-start mb-6"><span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">Create New Assignment/<br /></span><span className="text-bg-[#0F172A] text-2xl font-medium leading-7">Assignment Info<br /></span></div>
              <div className="grid grid-cols-2 gap-6"><div className="flex flex-col gap-4"><div className="flex items-start gap-4"><div className="flex flex-col"><div className="text-bg-[#0F172A] text-base font-semibold mb-2">Course Code</div><input type="text" className="w-72 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter course code" value={assignmentDetails.courseCode} onChange={(e) => handleDetailsChange("courseCode", e.target.value)} /></div><div className="flex flex-col"><div className="text-bg-[#0F172A] text-base font-semibold mb-2">Course Name</div><input type="text" className="w-72 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter course name" value={assignmentDetails.courseName} onChange={(e) => handleDetailsChange("courseName", e.target.value)} /></div></div><div className="flex flex-col"><div className="text-bg-[#0F172A] text-base font-semibold mb-2">Due Date</div><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !assignmentDetails.dueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{assignmentDetails.dueDate ? format(assignmentDetails.dueDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={assignmentDetails.dueDate} onSelect={(date) => handleDetailsChange("dueDate", date)} initialFocus /></PopoverContent></Popover></div><div className="flex flex-col"><div className="text-bg-[#0F172A] text-base font-semibold mb-2">Semester</div><div className="relative w-52 px-3 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-300 inline-flex justify-between items-center"><span className="flex-1 text-zinc-600 text-sm font-normal">{assignmentDetails.semester ? `Semester ${assignmentDetails.semester}`: "Select semester"}</span><img src="/CreateAssignment/icon/chevron-down.svg" alt="Dropdown arrow" className="w-4 h-4"/><select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={assignmentDetails.semester} onChange={(e) => handleDetailsChange("semester", e.target.value)}><option value="" disabled>Select semester</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></div></div></div></div>
              <div className="flex flex-col gap-2 mt-6"><div className="text-bg-[#0F172A] text-base font-semibold mb-2">Markers</div><div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-300 min-h-[360px] w-245">{markers.map((marker) => (<div key={marker.id} className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md outline outline-[0.67px] outline-offset-[-0.67px] outline-slate-300 flex flex-col justify-start gap-2"><div className="flex justify-between items-start"><div className="text-zinc-600 text-[8px] font-semibold">{marker.id}</div><div className="text-zinc-600 text-[8px] font-normal underline cursor-pointer" onClick={() => removeMarker(marker.id)}>Remove</div></div><div className="flex items-center gap-3.5"><div className="w-9 h-9 bg-black rounded-full flex-shrink-0" /><div className="text-bg-[#0F172A] text-base font-medium truncate">{marker.username}</div></div></div>))}<div className="w-56 h-28 px-4 pt-2.5 pb-1.5 bg-slate-50 rounded-md outline outline-1 outline-offset-[-0.67px] outline-slate-300 flex justify-center items-center cursor-pointer hover:bg-slate-100 transition" onClick={() => setShowMarkerList(!showMarkerList)}><div className="text-3xl font-bold text-zinc-600">+</div></div></div>{showMarkerList && (<div className="mt-3 flex flex-col gap-2 p-3 bg-white rounded-md outline outline-1 outline-slate-300 w-full">{loadingMembers ? ( <div>Loading team members...</div> ) : availableMembers.length === 0 ? ( <div className="text-sm text-zinc-600">No team members available.</div> ) : ( availableMembers.map((member) => ( <div key={member.id} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-md"> <div className="flex items-center gap-3.5"> <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" /> <div className="text-sm font-medium truncate">{member.username}</div> </div> <button className="px-2 py-1 bg-blue-500 text-white rounded-md" onClick={() => addMarker(member)}>+</button> </div> )) )}<div className="text-right mt-2"><button className="text-zinc-600 underline text-sm" onClick={() => setShowMarkerList(false)}>Close</button></div></div>)}</div>
            </>
          )}

          {step === 2 && (
             <div className="w-full mb-6">
              <span className="text-bg-[#0F172A] text-2xl font-semibold leading-7">Create New Assignment/<br /></span><span className="text-bg-[#0F172A] text-2xl font-medium leading-7">Rubric Setup<br /></span>
              <div className="justify-start text-bg-[#0F172A] text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Assignment Criteria</div>
            
              {/* Main container is now a flex column with a gap for spacing between cards */}
              <div className="w-full flex flex-col gap-4">
                {rubric.map((criterion) => (
                  // Each criterion is now a self-contained "Card"
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm" key={criterion.id} onContextMenu={(e) => handleRightClick(e, 'criterion', criterion.id)}>
                    {/* --- Card Body --- */}
                    <div className="p-4">
                      {/* Criterion Description */}
                      <AutoTextarea 
                        value={criterion.criteria} 
                        onChange={(e) => updateCriterionText(criterion.id, e.target.value)} 
                        placeholder="Describe the criterion here..."
                      />
                      
                      {/* Ratings "Pills" Section */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {criterion.tiers.map((tier, tierIndex) => (
                          <div 
                            key={tier.id} 
                            className="border border-slate-300 rounded-md flex-grow bg-slate-50/50 min-w-[150px] shadow-sm"
                            onContextMenu={(e) => {
                              e.stopPropagation(); // Prevent card's context menu from opening
                              handleRightClick(e, 'rating', criterion.id, tierIndex)}
                            }
                          >
                            <AutoTextarea 
                              value={tier.value} 
                              onChange={(e) => updateTierText(criterion.id, tierIndex, e.target.value)} 
                              placeholder="Describe rating..."
                            />
                          </div>
                        ))}
                        {/* Iconic "Add Rating" button */}
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
                          onClick={() => addRatingTier(criterion.id)}
                          title="Add Rating to this Criterion"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* --- Card Footer --- */}
                    {/* The "Data Footer" for points and deviation */}
                    <div className="flex items-center justify-end gap-6 p-2 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">Points</label>
                        <input
                          type="number"
                          value={criterion.points}
                          onChange={(e) => updatePoints(criterion.id, e.target.value)}
                          className="w-16 text-center bg-white rounded-md border border-slate-300 text-sm p-1 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">Deviation Threshold</label>
                        <div className="flex items-center bg-white rounded-md border border-slate-300">
                          <span className="text-slate-500 text-sm px-2">±</span>
                          <input
                            type="number"
                            value={criterion.deviation}
                            onChange={(e) => updateDeviation(criterion.id, e.target.value)}
                            className="w-12 text-center text-sm p-1 border-l border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full h-12 bg-slate-100 border border-dashed border-slate-400 rounded-lg flex justify-center items-center mt-5 cursor-pointer hover:bg-slate-200/70 transition-colors" onClick={addCriterion} title="Add New Criterion">
                <span className="text-slate-600 font-medium text-sm">+ Add New Criterion</span>
              </div>
              
              {contextMenu && (
                <div className="absolute bg-white border rounded shadow-lg z-10" style={{ top: contextMenu.y, left: contextMenu.x }}>
                  {contextMenu.type === 'rating' && ( <> <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleContextMenuAction('delete-box')}>Delete this Rating Box</div> <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleContextMenuAction('delete-column')}>Delete this Rating Column</div> </> )}
                  <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600" onClick={() => handleContextMenuAction('delete-row')}>Delete this Criterion</div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 px-6 mt-8">
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50">Save as Draft</button>
            {step === 2 && (<button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50" onClick={() => setStep(1)}>Back</button>)}
            {step === 1 && (<button className="px-4 py-2 bg-neutral-900 rounded-lg text-sm font-medium text-white hover:bg-neutral-800" onClick={() => setStep(2)}>Next</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}