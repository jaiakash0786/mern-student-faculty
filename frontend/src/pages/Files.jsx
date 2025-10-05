import { useEffect, useState } from "react";
import API from "../api/axios";
import "./Files.css";
export default function Files({ groupId }) {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");

  // fetch files
  const fetchFiles = async () => {
    try {
      const res = await API.get(`/files/group/${groupId}`);
      setFiles(res.data.files);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [groupId]);

  // upload file
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);
    if (description) formData.append("description", description);

    try {
      await API.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      setDescription("");
      fetchFiles();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  // download file with authentication
  const handleDownload = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem("token");
      
      // Method 1: Using fetch with authentication
      const response = await fetch(`http://localhost:5000/api/files/download/${fileId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName; // Use the original file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  // delete file
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await API.delete(`/files/${fileId}`);
      fetchFiles();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete file");
    }
  };

  return (
<div className="files-container">
  <form className="upload-form" onSubmit={handleUpload}>
    <h3>Upload File</h3>
    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
    <input
      type="text"
      placeholder="Description (optional)"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
    <button type="submit">Upload</button>
  </form>

  <h3>Group Files ({files.length})</h3>
  {files.length === 0 ? (
    <p>No files uploaded yet.</p>
  ) : (
    <ul className="file-list">
      {files.map((f) => (
        <li key={f._id} className="file-item">
          <div className="file-info">
            <strong>{f.originalName}</strong>
            <span>
              {f.description || "No description"} • {f.size && `Size: ${(f.size/1024).toFixed(1)} KB • `}
              Uploaded: {new Date(f.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="file-actions">
            <button className="download" onClick={() => handleDownload(f._id, f.originalName)}>Download</button>
            <button className="delete" onClick={() => handleDelete(f._id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>

  );
}