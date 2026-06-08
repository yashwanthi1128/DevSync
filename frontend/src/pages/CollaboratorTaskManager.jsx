import { useState, useRef } from "react";
import Layout from "../components/Layout";

export default function CollaboratorTaskManager() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Load tasks assigned to this specific collaborator
  const loadMyTasks = () => {
    try {
      return JSON.parse(localStorage.getItem(`tasks_${user._id}`) || "[]");
    } catch { return []; }
  };

  const [tasks, setTasks] = useState(loadMyTasks);
  const [uploadMap, setUploadMap] = useState({});
  const fileRefs = useRef({});

  const saveMyTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem(`tasks_${user._id}`, JSON.stringify(updated));
    // Also update admin_tasks so admin sees submitted status
    const adminTasks = JSON.parse(localStorage.getItem("admin_tasks") || "[]");
    const merged = adminTasks.map(t => {
      const mine = updated.find(u => u.id === t.id);
      return mine || t;
    });
    localStorage.setItem("admin_tasks", JSON.stringify(merged));
  };

  const formatDate = (d) => { if (!d) return ""; const [y,m,day] = d.split("-"); return `${day}-${m}-${y}`; };

  const formatDateTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  };

  const handleFileSelect = (id, file) => setUploadMap(prev => ({ ...prev, [id]: file }));

  const handleSubmit = (id) => {
    if (!uploadMap[id]) return;
    const updated = tasks.map(t =>
      t.id === id ? { ...t, status: "Completed", file: uploadMap[id].name, submittedAt: Date.now() } : t
    );
    saveMyTasks(updated);
    setUploadMap(prev => { const s = { ...prev }; delete s[id]; return s; });
  };

  const priorityColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
  const statusColor   = { Assigned: "#7c3aed", Pending: "#f59e0b", Completed: "#10b981" };

  const pending   = tasks.filter(t => t.status !== "Completed");
  const completed = tasks.filter(t => t.status === "Completed");

  return (
    <Layout>
      <h1 style={{ color: "#5f54f3", marginBottom: "4px" }}>My Tasks</h1>
      <p style={{ color: "#f8fafc", marginTop: 0, marginBottom: "24px" }}>
        Tasks assigned to you by the admin.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total",     value: tasks.length,    color: "#7c3aed" },
          { label: "Pending",   value: pending.length,  color: "#f59e0b" },
          { label: "Completed", value: completed.length,color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{
            background: `${s.color}22`, border: `1px solid ${s.color}44`,
            borderRadius: "12px", padding: "16px 24px", flex: 1, minWidth: "120px"
          }}>
            <p style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: s.color }}>{s.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: "16px", color: s.color, fontWeight: "600" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color: "#4b5563", fontSize: "16px", margin: 0 }}>No tasks assigned yet.</p>
          <p style={{ color: "#374151", fontSize: "13px", margin: "8px 0 0" }}>The admin will assign tasks to you soon.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tasks.map(t => (
            <div key={t.id} style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${t.status === "Completed" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "14px", padding: "20px", transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <p style={{
                  margin: 0, fontWeight: "700", fontSize: "16px",
                  color: t.status === "Completed" ? "#6b7280" : "#fff",
                  textDecoration: t.status === "Completed" ? "line-through" : "none"
                }}>{t.title}</p>
                <span style={{
                  background: `${statusColor[t.status] || "#6b7280"}22`,
                  color: statusColor[t.status] || "#6b7280",
                  padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700"
                }}>{t.status}</span>
              </div>

              {t.description && <p style={{ margin: "0 0 10px", color: "#9ca3af", fontSize: "13px" }}>{t.description}</p>}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px", marginBottom: "14px" }}>
                <span style={{ background: `${priorityColor[t.priority]}22`, color: priorityColor[t.priority], padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>
                  {t.priority} Priority
                </span>
                <span style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af", padding: "3px 10px", borderRadius: "20px" }}>
                 Deadline: {formatDate(t.deadline)}
                </span>
              </div>

              {t.status === "Completed" ? (
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <p style={{ margin: "0 0 4px", color: "#10b981", fontSize: "16px", fontWeight: "700" }}>Task Submitted</p>
                  <p style={{ margin: "0 0 2px", color: "#6b7280", fontSize: "14px" }}>File: {t.file}</p>
                  <p style={{ margin: 0, color: "#4b5563", fontSize: "13px" }}>Submitted on: {formatDateTime(t.submittedAt)}</p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#6b7280" }}>Upload your work and submit:</p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input type="file" ref={el => fileRefs.current[t.id] = el}
                      onChange={(e) => handleFileSelect(t.id, e.target.files[0])}
                      style={{ display: "none" }} />
                    <button onClick={() => fileRefs.current[t.id]?.click()} style={{
                      padding: "9px 18px", borderRadius: "8px",
                      background: uploadMap[t.id] ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                      color: uploadMap[t.id] ? "#10b981" : "#d1d5db",
                      border: `1px solid ${uploadMap[t.id] ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                      cursor: "pointer", fontSize: "13px", fontWeight: "600"
                    }}>
                      {uploadMap[t.id] ? `${uploadMap[t.id].name}` : "Upload File"}
                    </button>
                    <button onClick={() => handleSubmit(t.id)} disabled={!uploadMap[t.id]} style={{
                      padding: "9px 22px", borderRadius: "8px", border: "none",
                      background: uploadMap[t.id] ? "linear-gradient(90deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.05)",
                      color: uploadMap[t.id] ? "#fff" : "#4b5563",
                      cursor: uploadMap[t.id] ? "pointer" : "not-allowed",
                      fontWeight: "bold", fontSize: "13px", transition: "all 0.2s"
                    }}>Submit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}