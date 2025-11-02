import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MenuItem from "../components/NavbarMenu";
import api from "../utils/axios";
import * as XLSX from "xlsx";




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
      className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-normal text-slate-900 p-3 placeholder:text-zinc-600"
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
  const [uploadedRubricFile, setUploadedRubricFile] = useState(null);

  // --- STEP 1: ASSIGNMENT DETAILS STATE ---
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState({
    courseCode: "",
    courseName: "",
    semester: "",
    dueDate: undefined,
  });
  
  const handleRubricUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedRubricFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
    
      // Obtain the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
    
      // For consistency, convert the sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
      if (jsonData.length === 0) {
        alert("Excel file is empty. Please upload a valid rubric file.");
        return;
      }

  
      const parsedRubric = jsonData.map((row, index) => {
        // try multiple possible column names for each field
        const criteria = row.Criteria || row.Criterion || row["Criteria Description"] || "";
        const points = parseFloat(row.Points || row["Total Points"] || row.Score || 20);
        const deviation = row.Deviation ? parseFloat(row.Deviation) : "";
      
        // Try multiple possible column names for each tier description
        const hdDesc = row.HD || row["High Distinction"] || row["HD Description"] || "";
        const dDesc = row.D || row.Distinction || row["D Description"] || "";
        const cDesc = row.C || row.Credit || row["C Description"] || "";
        const pDesc = row.P || row.Pass || row["P Description"] || "";
        const fDesc = row.F || row.Fail || row["F Description"] || "";

        const totalPoints = isNaN(points) || points <= 0 ? 20 : points;

        return {
          id: crypto.randomUUID(),
          criteria: criteria || `Criterion ${index + 1}`,
          points: totalPoints,
          deviation: isNaN(deviation) ? "" : deviation,
          tiers: [
          { 
            id: crypto.randomUUID(), 
            name: "High Distinction", 
            description: hdDesc, 
            lowerBound: roundToHalf(totalPoints * 0.85), 
            upperBound: totalPoints 
          },
          { 
            id: crypto.randomUUID(), 
            name: "Distinction", 
            description: dDesc, 
            lowerBound: roundToHalf(totalPoints * 0.75), 
            upperBound: roundToHalf(totalPoints * 0.85) - 0.5 
          },
          { 
            id: crypto.randomUUID(), 
            name: "Credit", 
            description: cDesc, 
            lowerBound: roundToHalf(totalPoints * 0.65), 
            upperBound: roundToHalf(totalPoints * 0.75) - 0.5 
          },
          { 
            id: crypto.randomUUID(), 
            name: "Pass", 
            description: pDesc, 
            lowerBound: roundToHalf(totalPoints * 0.50), 
            upperBound: roundToHalf(totalPoints * 0.65) - 0.5 
          },
          { 
            id: crypto.randomUUID(), 
            name: "Fail", 
            description: fDesc, 
            lowerBound: 0, 
            upperBound: roundToHalf(totalPoints * 0.50) - 0.5 
          },
        ],
      };
    });

      // Ignore empty criteria or tiers
      const validRubric = parsedRubric.filter(item => 
        item.criteria.trim() !== "" || 
        item.tiers.some(tier => tier.description.trim() !== "")
      );

      if (validRubric.length === 0) {
        alert("Couldn't find valid rubric data in the uploaded file. Please check the file format.");
        return;
      }

      setRubric(validRubric);
    
    } catch (err) {
      console.error("Error occurs when reading data:", err);
      alert(`Fail to read: ${err.message}. Please ensure the file is a valid Excel format.`);
    }
  };

  const handleDetailsChange = (field, value) => {
    setAssignmentDetails((prev) => ({ ...prev, [field]: value }));
  };

  // --- MARKER STATE ---
  const [markers, setMarkers] = useState([]);
  const [showMarkerList, setShowMarkerList] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSemesterDropdownOpen && !event.target.closest('.semester-dropdown-container')) {
        setIsSemesterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSemesterDropdownOpen]);

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
  const availableMembers = teamMembers.filter((member) =>
    !markers.find((m) => String(m.id) === String(member.id)) &&
    (currentUser ? String(member.id) !== String(currentUser.id) : true)
  );

  // --- STEP 2: RUBRIC STATE & FUNCTIONS ---
  const [rubric, setRubric] = useState([{ id: crypto.randomUUID(), criteria: "", tiers: generateTiersWithPercentages(20), points: 20, deviation: "", },]);
  const [contextMenu, setContextMenu] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSemesterDropdownOpen && !event.target.closest('.semester-dropdown-container')) {
        setIsSemesterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSemesterDropdownOpen]);

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
  const updateDeviation = (criterionId, value) => {
    const percentage = parseFloat(value);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) return;
    setRubric(rubric.map((criterion) => criterion.id === criterionId ? { ...criterion, deviation: percentage } : criterion));
  }
  const addCriterion = () => setRubric([...rubric, { id: crypto.randomUUID(), criteria: "", tiers: generateTiersWithPercentages(20), points: 20, deviation: "", },]);
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
  const deleteRow = (criterionId) => {
    /*if (rubric.length < 2) {
      window.alert("At least one row of rubric is required.");
      return;
    }*/
    setRubric(rubric.filter((c) => c.id !== criterionId))};
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
  const [controlPaper, setControlPaper] = useState(null);
  

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
      if (!controlPaper) {
        alert("Please upload Control Paper before proceeding.");
        return;
      }
      setStep(4);
    }
  };

  const handleCreate = async () => {
    if (!controlPaper) {
    alert("Please upload the Control Paper before creating the assignment.");
    return;
    }

    const formData = new FormData();
    formData.append('controlPaper', controlPaper);
    console.log('Uploading control paper:');

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
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50">
        <Sidebar />
      </aside>
      <div className="ml-72 flex flex-col min-h-screen">
        <Navbar onBurgerClick={() => setMenuOpen(v => !v)} />
        <MenuItem menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={`transition-[margin] duration-300 ease-out flex-1 flex flex-col bg-neutral-100 ${menuOpen ? "ml-72" : "mr-0"}`}>
          <div className="px-6 py-6 flex-1 overflow-auto">
            {step === 1 && (
              <>
                {/* Header */}
                <div className="w-72 justify-start mb-6">
                  <span className="text-slate-900 text-2xl font-semibold leading-7">
                    Create New Assignment/<br />
                  </span>
                  <span className="text-slate-900 text-2xl font-medium leading-7">
                    Assignment Info<br />
                  </span>
                </div>

                {/* Assignment Info Inputs */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      {/* Course Code */}
                      <div className="flex flex-col">
                        <div className="text-slate-900 text-base font-semibold mb-2">
                          Course Code
                        </div>
                        <input
                          type="text"
                          className="text-sm font-normal text-slate-900 w-72 px-3 py-2 rounded-md bg-white rounded-md placeholder:text-zinc-600"
                          placeholder="Enter course code"
                          value={assignmentDetails.courseCode}
                          onChange={(e) =>
                            handleDetailsChange("courseCode", e.target.value)
                          }
                        />
                      </div>

                      {/* Course Name */}
                      <div className="flex flex-col">
                        <div className="text-slate-900 text-base font-semibold mb-2">
                          Course Name
                        </div>
                        <input
                          type="text"
                          className="text-sm font-normal text-slate-900 w-72 px-3 py-2 bg-white rounded-md placeholder:text-zinc-600"
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
                      <div className="text-slate-900 text-base font-semibold mb-2">
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
                              <span className="text-zinc-600">Pick a date</span>
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
                      <div className="text-slate-900 text-base font-semibold mb-2">
                        Semester
                      </div>
                      <div className="relative w-52 semester-dropdown-container">
                        <button
                          type="button"
                          onClick={() => setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                          className="w-full px-3 py-2.5 bg-white rounded-lg border border-slate-300 hover:focus:ring-offset-1 transition-all duration-200 flex items-center justify-between"
                        >
                          <span className={`text-sm font-medium ${assignmentDetails.semester ? 'text-slate-900' : 'text-slate-500'}`}>
                            {assignmentDetails.semester
                              ? `Semester ${assignmentDetails.semester}`
                              : "Select semester"}
                          </span>
                          <img
                            src="/CreateAssignment/icon/chevron-down.svg"
                            alt="Dropdown arrow"
                            className={`w-4 h-4 transition-transform duration-200 ${isSemesterDropdownOpen ? 'transform rotate-180' : ''}`}
                          />
                        </button>
                        
                        {isSemesterDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 max-h-60 overflow-auto">
                            {[
                              { value: "", label: "Select semester", disabled: true },
                              { value: "1", label: "Semester 1" },
                              { value: "2", label: "Semester 2" }
                            ].map((option) => {
                              const isSelected = assignmentDetails.semester === option.value;
                              return (
                                <button
                                  key={option.value || "default"}
                                  type="button"
                                  disabled={option.disabled}
                                  onClick={() => {
                                    if (!option.disabled) {
                                      handleDetailsChange("semester", option.value);
                                      setIsSemesterDropdownOpen(false);
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                    option.disabled 
                                      ? 'text-slate-400 cursor-not-allowed' 
                                      : isSelected 
                                        ? 'bg-slate-100 text-slate-900 font-semibold' 
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{option.label}</span>
                                    {isSelected && !option.disabled && (
                                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Markers */}
                <div className="flex flex-col gap-2 mt-6">
                  <div className="text-slate-900 text-base font-semibold mb-2">
                    Markers
                  </div>

                  {/* Marker Cards */}
                  <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg min-h-[360px] w-245">
                    {markers.map((marker) => (
                      <div
                        key={marker.id}
                        className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md outline outline-[0.67px] outline-offset-[-0.67px] outline-slate-300 flex flex-col justify-start gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-semibold text-zinc-600">
                            {marker.id}
                          </div>
                          <div
                            className={`text-sm font-normal text-zinc-600 underline ${currentUser && String(marker.id) === String(currentUser.id) ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}
                            onClick={() => removeMarker(marker.id)}
                          >
                            {currentUser && String(marker.id) === String(currentUser.id) ? 'Creator (Cannot Remove)' : 'Remove'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                          <div className="text-sm font-medium text-slate-900 truncate">
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
                      <div className="text-5xl font-light text-deakinTeal mb-2">+</div>
                    </div>
                  </div>

                  {/* Marker List Dropdown */}
                  {showMarkerList && (
                    <div className="mt-3 w-245 flex flex-col gap-2 p-3 bg-white rounded-md outline outline-1 outline-slate-300">
                      {loadingMembers ? (
                        <div>Loading team members...</div>
                      ) : availableMembers.length === 0 ? (
                        <div className="text-sm font-normal text-zinc-600">
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
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {member.username}
                              </div>
                            </div>
                            <button
                              className="px-5 py-1 bg-deakinTeal text-white rounded-md cursor-pointer hover:bg-[#0E796B]"
                              onClick={() => addMarker(member)}
                            >
                              +
                            </button>
                          </div>
                        ))
                      )}

                      <div className="text-right mt-2">
                        <button
                            className="text-sm font-normal text-zinc-600 underline cursor-pointer"
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
    <span className="text-slate-900 text-2xl font-semibold leading-7">
      Create New Assignment/<br />
    </span>
    <span className="text-slate-900 text-2xl font-medium leading-7">
      Rubric Setup<br />
    </span>

    {/* Upload Rubric XLSX */}
    <div className="mt-8 mb-6">
      <label className="text-slate-900 text-base font-semibold mb-2 block">
        Upload Rubric File (.xlsx) to Auto-Fill Criteria (Please ensure the file follows template format)
      </label>

      {uploadedRubricFile ? (
        <div className="p-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-slate-800">
              {uploadedRubricFile.name}
            </span>
          </div>
          <button
            onClick={() => setUploadedRubricFile(null)}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="rubric-upload"
          className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">Only .xlsx files supported and file size should less than 5 MB</p>
          </div>
          <input
            id="rubric-upload"
            type="file"
            accept=".xlsx"
            className="absolute inset-0 w-full h-full opacity-0"
            onChange={handleRubricUpload}
          />
        </label>
      )}
    </div>

    {/* Rubric Table Header */}
    <div className="justify-start text-slate-900 text-base font-semibold leading-7 pt-4 pb-4">
      Assignment Criteria
    </div>

    <div className="w-full flex flex-col">
      {/* Header Row */}
      <div className="flex bg-deakinTeal rounded-t-lg">
        <div className="p-3" style={{ flexBasis: "5%" }}>
          <div className="text-white text-xs font-semibold"></div>
        </div>
        <div className="p-3" style={{ flexBasis: "12%" }}>
          <div className="text-white text-xs font-semibold">
            Criteria Description
          </div>
        </div>
        <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}>
          <div className="text-white text-xs font-semibold">High Distinction</div>
        </div>
        <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}>
          <div className="text-white text-xs font-semibold">Distinction</div>
        </div>
        <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}>
          <div className="text-white text-xs font-semibold">Credit</div>
        </div>
        <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}>
          <div className="text-white text-xs font-semibold">Pass</div>
        </div>
        <div className="p-3 text-left border-l border-zinc-400" style={{ flex: 1 }}>
          <div className="text-white text-xs font-semibold">Fail</div>
        </div>
        <div className="p-3 border-l border-zinc-400" style={{ flexBasis: "8%" }}>
          <div className="text-white text-xs font-semibold">Pts</div>
        </div>
        <div className="p-3 border-l border-zinc-400" style={{ flexBasis: "12%" }}>
          <div className="text-white text-xs font-semibold">Deviation</div>
        </div>
      </div>

      {/* Dynamic Rubric Rows */}
      {rubric.map((criterion) => (
        <div
          className="flex bg-white border-l border-r border-b border-zinc-300 last:rounded-b-lg"
          key={criterion.id}
        >
          <div
            className="flex items-center justify-center p-2 border-r border-zinc-300"
            style={{ flexBasis: "5%" }}
          >
            <button
              onClick={() => deleteRow(criterion.id)}
              className="p-1 rounded-full hover:bg-green-100 text-green-600 hover:text-green-800"
              title="Delete this criterion row"
              disabled={rubric.length <= 1}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="flex"
            style={{ flexBasis: "12%" }}
            onContextMenu={(e) => handleRightClick(e, criterion.id)}
          >
            <AutoTextarea
              value={criterion.criteria}
              onChange={(e) =>
                updateCriterionText(criterion.id, e.target.value)
              }
              placeholder="Criterion..."
            />
          </div>


          {criterion.tiers.map((tier, tierIndex) => (
            <div
              key={tier.id}
              className="border-l border-zinc-300 flex flex-col justify-between bg-white/40 min-w-[120px] min-h-[120px]"
              style={{ flex: 1 }}
              onContextMenu={(e) => handleRightClick(e, criterion.id)}
            >
              <AutoTextarea
                value={tier.description}
                onChange={(e) =>
                  updateTierDescription(criterion.id, tierIndex, e.target.value)
                }
                placeholder={`Describe ${tier.name}...`}
              />
              <div className="flex items-center justify-center p-1 bg-slate-50 border-t border-zinc-300">
                <input
                  type="number"
                  step="0.5"
                  value={tier.lowerBound}
                  onChange={(e) =>
                    updateTierLowerBound(criterion.id, tierIndex, e.target.value)
                  }
                  className="w-12 text-center text-xs text-slate-900 bg-transparent focus:outline-none"
                  disabled={tierIndex === criterion.tiers.length - 1}
                />
                <span className="text-xs mx-1">-</span>
                <span className="w-12 text-center text-xs">
                  {tier.upperBound}
                </span>
              </div>
            </div>
          ))}

          <div
            className="border-l border-zinc-300 relative flex items-center justify-center p-2"
            style={{ flexBasis: "8%" }}
            onContextMenu={(e) => handleRightClick(e, criterion.id)}
          >
            <input
              type="number"
              step="0.5"
              value={criterion.points}
              onChange={(e) => updatePoints(criterion.id, e.target.value)}
              className="w-full text-center bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] text-xs text-slate-900 p-2 placeholder:text-zinc-600"
              placeholder="Pts"
            />
          </div>

          <div
            className="border-l border-zinc-300 flex items-center justify-center p-2"
            style={{ flexBasis: "12%" }}
            onContextMenu={(e) => handleRightClick(e, criterion.id)}
          >
            <div className="w-full flex items-center gap-1 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-[#E4E4E7] p-2">
              <span className="text-slate-900 font-normal">±</span>
              <input
                type="number"
                step="0.5"
                value={criterion.deviation}
                onChange={(e) =>
                  updateDeviation(criterion.id, e.target.value)
                }
                className="w-full text-center text-xs text-slate-900 placeholder:text-zinc-600"
                placeholder="Dev"
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    <div
      className="w-61 h-12 bg-deakinTeal text-white border-zinc-400 rounded-lg flex justify-center items-center mt-5 cursor-pointer text-5xl font-extralight mb-5 pb-2 hover:bg-slate-100"
      onClick={addCriterion}
      title="Add New Criterion Row"
    >
      +
    </div>

    {contextMenu && (
      <div
        className="absolute bg-white border rounded shadow-lg z-10"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <div
          className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-red-600"
          onClick={() => handleContextMenuAction("delete-row")}
        >
          Delete this Criterion Row
        </div>
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
                  {/* Uploader for Control Paper */}
                  <div className="flex flex-col gap-2">
                    <label className="text-bg-[#0F172A] text-base font-semibold">Control Paper</label>
                    {controlPaper ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <File className="w-6 h-6 text-blue-600" />
                          <span className="text-sm font-medium text-slate-800">{controlPaper.name}</span>
                        </div>
                        <button onClick={() => setControlPaper(null)} className="p-1 rounded-full hover:bg-slate-100">
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">PDF, DOCX, etc.</p>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0"
                          onChange={(e) => setControlPaper(e.target.files[0])}
                        />
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
                  <span className="text-slate-900 text-2xl font-semibold leading-7">Create New Assignment/<br /></span>
                  <span className="text-slate-900 text-2xl font-medium leading-7">Review & Create<br /></span>
                </div>

                {/* Assignment Details Review */}
                <div className="justify-start text-slate-900 text-base font-semibold font-['Inter'] leading-7 pt-2 pb-4">Assignment Information</div>
                <div className="p-4 bg-white rounded-lg grid grid-cols-2 gap-x-6 gap-y-4">
                  <div><span className="font-semibold">Course Code:</span> {assignmentDetails.courseCode}</div>
                  <div><span className="font-semibold">Course Name:</span> {assignmentDetails.courseName}</div>
                  <div><span className="font-semibold">Semester:</span> Semester {assignmentDetails.semester}</div>
                  <div><span className="font-semibold">Due Date:</span> {assignmentDetails.dueDate ? format(assignmentDetails.dueDate, "PPP") : 'N/A'}</div>
                </div>

                {/* Markers Review */}
                <div className="justify-start text-slate-900 text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Assigned Markers</div>
                <div className="flex flex-wrap gap-2">
                  {markers.map((marker) => (
                    <div key={marker.id} className="w-56 h-[7rem] px-4 pt-2.5 pb-1.5 bg-white rounded-md flex flex-col justify-start gap-2">
                      <div className="flex justify-between items-start">
                        <div className="text-zinc-600 text-[8px] font-semibold">{marker.id}</div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 bg-black rounded-full flex-shrink-0" />
                        <div className="text-slate-900 text-base font-medium truncate">
                          {marker.username} {currentUser && String(marker.id) === String(currentUser.id) && '(Creator)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Control Paper Review */}
                <div className="justify-start text-slate-900 text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">
                  Control Paper
                </div>
                <div className="p-4 bg-white rounded-lg flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">Control Paper</p>
                    <p className="text-xs text-slate-600">{controlPaper?.name || 'No file selected'}</p>
                  </div>
                </div>

                {/* Rubric Review */}
                <div className="justify-start text-slate-900 text-base font-semibold font-['Inter'] leading-7 pt-8 pb-4">Final Rubric</div>
                <div className="w-full flex flex-col">
                  {/* Header Row */}
                  <div className="flex bg-deakinTeal rounded-t-lg border border-zinc-300 border-b-0">
                    <div className="p-3" style={{ flexBasis: '5%' }}><div className="text-white text-xs font-semibold"></div></div>
                    <div className="p-3" style={{ flexBasis: '12%' }}><div className="text-white text-xs font-semibold">Criteria</div></div>
                    <div className="p-3 text-left border-l border-zinc-300" style={{ flex: 1 }}><div className="text-white text-xs font-semibold">High Distinction</div></div>
                    <div className="p-3 text-left border-l border-zinc-300" style={{ flex: 1 }}><div className="text-white text-xs font-semibold">Distinction</div></div>
                    <div className="p-3 text-left border-l border-zinc-300" style={{ flex: 1 }}><div className="text-white text-xs font-semibold">Credit</div></div>
                    <div className="p-3 text-left border-l border-zinc-300" style={{ flex: 1 }}><div className="text-white text-xs font-semibold">Pass</div></div>
                    <div className="p-3 text-left border-l border-zinc-300" style={{ flex: 1 }}><div className="text-white text-xs font-semibold">Fail</div></div>
                    <div className="p-3 border-l border-zinc-300" style={{ flexBasis: '8%' }}><div className="text-white text-xs font-semibold">Pts</div></div>
                    <div className="p-3 border-l border-zinc-300" style={{ flexBasis: '12%' }}><div className="text-white text-xs font-semibold">Deviation</div></div>
                  </div>

                  {/* Data Rows */}
                  {rubric.map((criterion) => (
                    <div className="flex bg-white border-l border-r border-b border-zinc-300 last:rounded-b-lg" key={criterion.id}>
                      <div className="p-3" style={{ flexBasis: '12%' }}><p className="text-xs">{criterion.criteria}</p></div>
                      {criterion.tiers.map((tier) => (
                          <div key={tier.id} className="border-l border-zinc-300 flex flex-col justify-between min-w-[120px]" style={{ flex: 1 }}>
                              <p className="text-xs p-3">{tier.description}</p>
                              <div className="flex items-center justify-center p-1 bg-slate-50 border-t border-zinc-300">
                                  <span className="w-12 text-center text-xs">{tier.lowerBound}</span>
                                  <span className="text-xs mx-1">-</span>
                                  <span className="w-12 text-center text-xs">{tier.upperBound}</span>
                              </div>
                          </div>
                      ))}
                      <div className="border-l border-zinc-300 flex items-center justify-center p-2" style={{ flexBasis: '8%' }}><p className="text-xs">{criterion.points}</p></div>
                      <div className="border-l border-zinc-300 flex items-center justify-center p-2" style={{ flexBasis: '12%' }}><p className="text-xs">± {criterion.deviation}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 px-6 mt-8">
              {step > 1 && (
                <button 
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-zinc-900 hover:bg-gray-50 cursor-pointer" 
                  onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              {step < 4 && (
                <button 
                  className="px-4 py-2 bg-deakinTeal rounded-lg text-sm font-base text-white hover:bg-[#0E796B] cursor-pointer" 
                  onClick={handleNextStep}>
                  {step === 3 ? 'Review' : 'Next'}
                </button>
              )}
              {step === 4 && (
                <button 
                  className="px-4 py-2 bg-deakinTeal rounded-lg text-sm font-medium text-white hover:bg-[#0E796B] cursor-pointer"
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