import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css"; // import page-wide CSS

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Welcome, {user?.name}</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <button onClick={logout} className="dashboard-logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}
