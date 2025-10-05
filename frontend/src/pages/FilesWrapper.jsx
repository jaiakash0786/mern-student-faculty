import { useParams } from "react-router-dom";
import Files from "./Files";

export default function FilesWrapper() {
  const { id } = useParams();
  return <Files groupId={id} />;
}
