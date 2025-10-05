import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Tasks.css"; // Import the CSS file

export default function Tasks({ groupId }) {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedTo, setAssignedTo] = useState(""); 

  // fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await API.get(`/tasks/group/${groupId}?status=pending`);
      setTasks(res.data.tasks);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [groupId]);

  // assign task (faculty only)
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignedTo) return alert("Please provide assigned user ID");
    try {
      await API.post("/tasks", {
        title,
        description,
        assignedTo,
        groupId,
        deadline,
        priority,
      });
      setTitle(""); setDescription(""); setDeadline(""); setPriority("low"); setAssignedTo("");
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign task");
    }
  };

  // update task status (student submission)
  const handleSubmitTask = async (taskId) => {
    const submissionText = prompt("Enter your submission text:");
    if (!submissionText) return;
    try {
      await API.patch(`/tasks/${taskId}/status`, { status: "submitted", submissionText });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit task");
    }
  };

  return (
    <div className="tasks-container">
      <h2 className="tasks-heading">Tasks</h2>

      {/* Faculty: Assign Task */}
      {user.role === "faculty" && (
        <form onSubmit={handleAssign} className="assign-form">
          <h3>Assign Task</h3>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input placeholder="Assign to User ID" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required />
          <button type="submit" className="assign-btn">Assign</button>
        </form>
      )}

      {/* List Tasks */}
      <h3 className="group-tasks-heading">Group Tasks</h3>
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task._id} className="task-item">
            <b>{task.title}</b> - {task.description} <br />
            Deadline: {new Date(task.deadline).toLocaleDateString()} | 
            Priority: <span className={`priority ${task.priority}`}>{task.priority}</span> | 
            Status: {task.status} <br />
            {user.role === "student" && task.status !== "completed" && (
              <button onClick={() => handleSubmitTask(task._id)} className="submit-btn">
                Submit Task
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
