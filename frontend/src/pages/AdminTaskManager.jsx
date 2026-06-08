import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

import { FiEdit2, FiTrash2 } from 'react-icons/fi'


export default function AdminTaskManager() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", priority: "Medium", assignee: null, projectId: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("/projects");
        const mine = res.data.projects.filter(p => p.createdBy?._id === user._id);
        setProjects(mine);
      } catch (err) { console.log(err); }
    };
    fetch();
    // Load all tasks admin created
    const stored = JSON.parse(localStorage.getItem("admin_tasks") || "[]");
    setTasks(stored);
  }, [user._id]);

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem("admin_tasks", JSON.stringify(updated));

    // Also group tasks by assignee ID and save for each collaborator
    const byAssignee = {};
    updated.forEach(t => {
      if (t.assignee?._id) {
        if (!byAssignee[t.assignee._id]) byAssignee[t.assignee._id] = [];
        byAssignee[t.assignee._id].push(t);
      }
    });
    // Save each collaborator's tasks under their own key
    Object.entries(byAssignee).forEach(([uid, tasks]) => {
      localStorage.setItem(`tasks_${uid}`, JSON.stringify(tasks));
    });
  };

  const members = selectedProject
    ? [...(selectedProject.applications || []), ...(selectedProject.collaborators || [])]
    : [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAssign = (member) => setForm(f => ({ ...f, assignee: f.assignee?._id === member._id ? null : member }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline) { setError("Title and deadline are required."); return; }
    if (!form.assignee) { setError("Please select a member to assign."); return; }
    setError("");
    let updated;
    if (editId) {
      updated = tasks.map(t => t.id === editId ? { ...t, ...form } : t);
      setEditId(null);
    } else {
      updated = [...tasks, { ...form, id: Date.now(), status: "Assigned", file: null, submittedAt: null }];
    }
    saveTasks(updated);
    setForm({ title: "", description: "", deadline: "", priority: "Medium", assignee: null, projectId: selectedProject?._id || "" });
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, description: task.description, deadline: task.deadline, priority: task.priority, assignee: task.assignee, projectId: task.projectId });
    setEditId(task.id);
  };

  const handleDelete = (id) => saveTasks(tasks.filter(t => t.id !== id));

  const priorityColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
  const statusColor = { Assigned: "#7c3aed", Pending: "#f59e0b", Completed: "#10b981" };
  const formatDate = (d) => { if (!d) return ""; const [y,m,day] = d.split("-"); return `${day}-${m}-${y}`; };

  return (
    <Layout>
      <h1 style={{ color: "#5f54f3", marginBottom: "4px" }}>Task Manager</h1>
      <p style={{ color: "#f8fafc", marginTop: 0, marginBottom: "24px" }}>Assign and manage tasks for your team.</p>

      {/* Step 1 */}
      <div style={card}>
        <p style={sectionLabel}> (Step 1) Select Project</p>
        {projects.length === 0
          ? <p style={{ color: "#4b5563", fontSize: "16px" }}>No projects found.</p>
          : <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {projects.map(p => (
                <div key={p._id} onClick={() => { setSelectedProject(p); setForm(f => ({ ...f, projectId: p._id, assignee: null })); }}
                  style={{
                    padding: "10px 18px", borderRadius: "10px", cursor: "pointer",
                    border: `2px solid ${selectedProject?._id === p._id ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
                    background: selectedProject?._id === p._id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    color: selectedProject?._id === p._id ? "#a78bfa" : "#9ca3af",
                    fontWeight: selectedProject?._id === p._id ? "700" : "400", fontSize: "14px", transition: "all 0.2s"
                  }}>
                  {p.title}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Step 2 */}
      {selectedProject && (
        <div style={card}>
          <p style={sectionLabel}>(Step 2) Select Member</p>
          {members.length === 0
            ? <p style={{ color: "#4b5563", fontSize: "14px" }}>No applicants or collaborators yet.</p>
            : <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {members.map(m => (
                  <div key={m._id} onClick={() => handleAssign(m)} style={{
                    padding: "10px 16px", borderRadius: "10px", cursor: "pointer",
                    border: `2px solid ${form.assignee?._id === m._id ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                    background: form.assignee?._id === m._id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                    color: form.assignee?._id === m._id ? "#10b981" : "#9ca3af",
                    fontWeight: form.assignee?._id === m._id ? "700" : "400", fontSize: "14px", transition: "all 0.2s"
                  }}>
                 {m.name} {form.assignee?._id === m._id && ""}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Step 3 */}
      {selectedProject && (
        <div style={card}>
          <p style={sectionLabel}>(Step 3) {editId ? "Edit Task" : "Create Task"}</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Task title *" style={input} />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" rows={2} style={{ ...input, resize: "vertical" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} style={{ ...input, flex: 1 }} />
              <select name="priority" value={form.priority} onChange={handleChange} style={{ ...input, flex: 1, colorScheme: "dark" }}>
                <option style={{ background: "#1a1a2e", color: "#fff" }}>High</option>
                <option style={{ background: "#1a1a2e", color: "#fff" }}>Medium</option>
                <option style={{ background: "#1a1a2e", color: "#fff" }}>Low</option>
              </select>
            </div>
            {form.assignee && <p style={{ margin: 0, fontSize: "13px", color: "#10b981" }}>Assigning to: <b>{form.assignee.name}</b></p>}
            {error && <p style={{ color: "#ef4444", margin: 0, fontSize: "13px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "10px" }}>
              {editId && <button type="button" onClick={() => { setEditId(null); setForm({ title: "", description: "", deadline: "", priority: "Medium", assignee: null, projectId: selectedProject?._id || "" }); }} style={{ ...btn, background: "rgba(255,255,255,0.08)", color: "#9ca3af", flex: 1 }}>Cancel</button>}
              <button type="submit" style={{ ...btn, flex: 2 }}>{editId ? "Update Task" : "Assign Task"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div>
          <p style={sectionLabel}>All Assigned Tasks ({tasks.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tasks.map(t => (
              <div key={t.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", color: "#fff", fontWeight: "700", fontSize: "18px" }}>{t.title}</p>
                    {t.description && <p style={{ margin: "0 0 8px", color: "#9ca3af", fontSize: "15px" }}>{t.description}</p>}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "14px" }}>
                      {t.assignee && <span style={chip("#10b981")}>{t.assignee.name}</span>}
                      <span style={chip(priorityColor[t.priority])}>{t.priority}</span>
                      <span style={chip("#6b7280")}>{formatDate(t.deadline)}</span>
                      <span style={chip(statusColor[t.status] || "#6b7280")}>{t.status}</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap:"8px", marginLeft: "12px" }}>
                  <button onClick={() => handleEdit(t)} style={iconBtn("#7c3aed")}>
                  <FiEdit2 /> Edit
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={iconBtn("#ef4444")}>
                  <FiTrash2 /> Delete
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

const card = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "20px", marginBottom: "16px" };
const sectionLabel = { margin: "0 0 12px", color: "#a78bfa", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" };
const input = { padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
const btn = { padding: "10px", borderRadius: "8px", background: "linear-gradient(90deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const chip = (color) => ({ background: `${color}22`, color, padding: "3px 10px", borderRadius: "20px", fontWeight: "600" });
const iconBtn = (color) => ({ padding: "6px 10px", background: `${color}22`, color, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" });