import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const joinGroup = async () => {
      try {
        await API.post(`/groups/join/${inviteCode}`);
        alert("Successfully joined the group!");
        navigate("/groups");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to join group");
        navigate("/groups");
      }
    };

    joinGroup();
  }, [inviteCode, navigate]);

  return <p>Joining group...</p>;
}
