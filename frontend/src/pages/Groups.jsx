import { useEffect, useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import "./Groups.css";
export default function Groups() {
    const [groups, setGroups] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const navigate = useNavigate(); // Add this hook

    // fetch all groups
    const fetchGroups = async () => {
        try {
            const res = await API.get("/groups");
            setGroups(res.data.groups);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to load groups");
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // create group
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post("/groups", { name, description, isPublic: true });
            setName("");
            setDescription("");
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create group");
        }
    };

    // join group
    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            await API.post(`/groups/join/${inviteCode}`);
            setInviteCode("");
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to join group");
        }
    };

    return (<div className="groups-container">
  <form className="group-form" onSubmit={handleCreate}>
    <h3>Create Group</h3>
    <input placeholder="Group Name" value={name} onChange={(e) => setName(e.target.value)} required />
    <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
    <button type="submit">Create</button>
  </form>

  <form className="group-form" onSubmit={handleJoin}>
    <h3>Join Group</h3>
    <input placeholder="Invite Code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
    <button type="submit">Join</button>
  </form>

  <h3>My Groups</h3>
  <div className="group-list">
    {groups.map((g) => (
      <div key={g._id} className="group-item">
        <Link to={`/groups/${g._id}`} className="group-name">{g.name}</Link>
        <p className="group-desc">{g.description}</p>
        <div className="group-actions">
          <Link to={`/groups/${g._id}/files`} className="view-files">View Files</Link>
          <span className="group-members">Members: {g.members?.length || 0}</span>
        </div>
      </div>
    ))}
  </div>
</div>

    );
}