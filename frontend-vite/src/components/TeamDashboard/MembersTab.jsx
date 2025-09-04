export default function MembersTab({ members, team, onInviteClick }) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      <ul className="space-y-4">
        {members.map((member) => (
          <li key={member.id} className="p-4 border rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{member.username}</p>
                <p className="text-sm text-gray-600">Role: {member.role}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Invite Button */}
      <div className="mt-4 flex justify-left">
        <button
          onClick={onInviteClick}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Invite Members
        </button>
      </div>
    </div>
  );
}
