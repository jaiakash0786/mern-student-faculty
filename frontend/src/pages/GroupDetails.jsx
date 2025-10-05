import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./GroupDetails.css";
export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch single group
  const fetchGroup = async () => {
    try {
      const res = await API.get(`/groups/${id}`);
      console.log("Full API response:", res.data);
      setGroup(res.data.group);
    } catch (err) {
      console.error("Error:", err);
      alert(err.response?.data?.message || "Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  // leave group
  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await API.post(`/groups/${id}/leave`);
      navigate("/groups");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave group");
    }
  };

  // copy invite link
  const handleCopyLink = () => {
    if (group?.inviteCode) {
      const link = `${window.location.origin}/join/${group.inviteCode}`;
      navigator.clipboard.writeText(link);
      alert("Invite link copied to clipboard!");
    } else {
      alert("No invite code available");
    }
  };

  // navigate to files page
  const handleViewFiles = () => {
    navigate(`/groups/${id}/files`);
  };

  if (loading) return <p>Loading group details...</p>;
  if (!group) return <p>Group not found</p>;

  return (
    <div className="group-details-container">
  <h2>{group.name}</h2>
  <p>{group.description}</p>

  <div className="invite-code-box">
    <strong>Invite Code:</strong> {group.inviteCode}
  </div>

  <div className="button-group">
    <button onClick={handleCopyLink} className="button-copy">Copy Invite Link</button>
    <button onClick={handleViewFiles} className="button-files">View Files</button>
    <button onClick={handleLeave} className="button-leave">Leave Group</button>
  </div>

  <div className="group-lists">
    <div>
      <h3>Faculty ({group.faculty?.length || 0})</h3>
      {group.faculty?.length ? (
        <ul>
          {group.faculty.map((faculty, index) => (
            <li key={faculty._id || index}>
              {faculty.name} ({faculty.email}) - {faculty.role}
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">No faculty members</p>}
    </div>

    <div>
      <h3>Members ({group.members?.length || 0})</h3>
      {group.members?.length ? (
        <ul>
          {group.members.map((member, index) => (
            <li key={member._id || index}>
              <strong>{member.user?.name}</strong> ({member.user?.email})<br />
              <small>
                Role: {member.role} • Joined: {new Date(member.joinedAt).toLocaleDateString()}
              </small>
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">No members yet</p>}
    </div>
  </div>
</div>
  );
}