import { useParams } from "react-router-dom";
import Tasks from "./Tasks";

export default function TasksWrapper() {
  const { id } = useParams();
  return <Tasks groupId={id} />;
}
