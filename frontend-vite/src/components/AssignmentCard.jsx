export default function AssignmentCard({ assignment, onNavigate, onDelete }) {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'complete':
                return 'bg-[var(--deakinTeal)] text-white';
            case 'marking':
                return 'bg-[var(--lime)] text-gray-800';
            case 'moderating':
                return 'bg-[var(--purple)] text-white';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div
            key={assignment.id}
            onClick={() => onNavigate(`assignments/${assignment.id}`)}
            className="w-full bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-slate-200 px-6 pt-3.5 pb-4 hover:shadow-md transition cursor-pointer inline-flex flex-col justify-start items-start gap-1.5"
        >
            {/* 'semester' from the API */}
            <div className="w-full inline-flex justify-between items-center">
                <div className="text-xs text-zinc-400">
                    Semester {assignment.semester}
                </div>
                <div className={`px-3 pt-1 pb-1 rounded-full text-xs font-base ${getStatusColor(assignment.status)}`}>
                    <div className="justify-start text-xs font-medium font-['Inter'] leading-normal">{assignment.status.charAt(0) + assignment.status.slice(1).toLowerCase()}</div>
                </div>                        
            </div>
            

            {/* Using 'course_name' instead of 'title' */}
            <div className="w-full flex flex-col items-start">
                <div className="text-offical-black text-2xl font-medium font-['Inter'] leading-7 text-left">{assignment.course_name}</div>
            </div>
            
            {/* Using 'course_code' from the API */}
            <div className="text-sm text-zinc-400 mb-2">
                {assignment.course_code}
            </div>
            
            <div className="justify-start text-black text-xs font-normal font-['Inter'] leading-7">
                {assignment.markersAlreadyMarked || 0} / {assignment.markers?.length || 0 } graded 
                ({((assignment.markersAlreadyMarked || 0) / (assignment.markers?.length || 0) * 100).toFixed(0)}%)
            </div>

            <div className="flex-grow"></div> {/* Pushes due date to the bottom */}
            
            <div className="mt-4 flex items-center justify-between w-full">
                {/* Formatting the due date for better readability */}
                <div className="text-xs text-gray-400">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 underline underline-offset-4 decoration-1 decoration-zinc-400">
                    {/* export button, placeholder for now */}
                    <button className="py-1 text-zinc-400 rounded-md text-xs cursor-pointer hover:text-deakinTeal">
                        Export
                    </button>
                    {/* Delete button outside the clickable area */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // stop click bubbling to card
                            onDelete(assignment.id);
                        }}
                        className="py-1 text-zinc-400 rounded-md text-xs cursor-pointer hover:text-deakinTeal"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
