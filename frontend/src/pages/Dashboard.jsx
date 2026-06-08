import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, applied: 0, accepted: 0, rejected: 0 });
  const [allProjects, setAllProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/projects");
        console.log("API Response:", res.data); // DEBUG
        
        const projects = (res.data.projects || []).map(p => ({
          ...p,
          status: p.status || "Open", // Fallback for old projects
          rejected: p.rejected || [] // Fallback
        }));
        
        console.log("Normalized projects:", projects); // DEBUG
        setAllProjects(projects);

        const applied = projects.filter((p) => p.applications?.some((a) => (a._id || a).toString() === user._id)).length;
        const accepted = projects.filter((p) => p.collaborators?.some((c) => (c._id || c).toString() === user._id)).length;
        const rejected = projects.filter((p) => p.rejected?.some((r) => (r._id || r).toString() === user._id)).length;

        setStats({ totalProjects: projects.length, applied, accepted, rejected });
      } catch (err) {
        console.log("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user._id]);

  if (loading) return <Layout><p style={{ color: "#fff" }}>Loading...</p></Layout>;

  const cards = [
    { key: "total", label: "Total Projects", value: stats.totalProjects, grad: "linear-gradient(135deg, #7c3aed, #4f46e5)" },
    { key: "applied", label: "Applied To", value: stats.applied, grad: "linear-gradient(135deg, #d97706, #f59e0b)" },
    { key: "accepted", label: "Accepted In", value: stats.accepted, grad: "linear-gradient(135deg, #059669, #10b981)" },
    { key: "rejected", label: "Rejected From", value: stats.rejected, grad: "linear-gradient(135deg, #dc2626, #ef4444)" },
  ];

  const filteredProjects = allProjects.filter((p) => {
    if (activeFilter === "total") return true;
    if (activeFilter === "applied") return p.applications?.some((a) => (a._id || a).toString() === user._id);
    if (activeFilter === "accepted") return p.collaborators?.some((c) => (c._id || c).toString() === user._id);
    if (activeFilter === "rejected") return p.rejected?.some((r) => (r._id || r).toString() === user._id);
    return false;
  });

  const filterTitles = {
    total: "All Projects",
    applied: "Projects You Applied To",
    accepted: "Projects You Were Accepted In",
    rejected: "Projects You Were Rejected From",
  };

  const filterColors = {
    total: "#a78bfa",
    applied: "#f59e0b",
    accepted: "#10b981",
    rejected: "#ef4444",
  };

  return (
    <Layout>
      <h1 style={{ color: "rgb(92, 83, 220)", marginBottom: "0px", fontSize: "30px" }}>Hello, {user.name}</h1>
      <p style={{ color: "#f8fafc", marginTop: 0, marginBottom: "30px", fontSize: "16px" }}>
        Here's a summary of your activity on DevSync
      </p>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        {cards.map((s) => (
          <div key={s.key} onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
            style={{
              background: s.grad, padding: "24px 26px",
              borderRadius: "14px", minWidth: "130px", flex: 1,
              boxShadow: activeFilter === s.key ? "0 0 0 3px #fff, 0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.3)",
              cursor: "pointer", transform: activeFilter === s.key ? "translateY(-3px)" : "none",
              transition: "all 0.2s"
            }}> 
            <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold", color: "#fff" }}>{s.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: "18px", color: "#fff", fontWeight: "600" }}>{s.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#fff" }}>
              {activeFilter === s.key ? "Click to close ↑" : "Click to view →"}
            </p>
          </div>
        ))}
      </div>

      {/* Project list panel */}
      {activeFilter && (
        <div style={{
          background: "#1a1a2e", borderRadius: "16px", marginBottom: "28px",
          border: `1px solid ${filterColors[activeFilter]}40`,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h3 style={{ margin: 0, color: filterColors[activeFilter], fontSize: "17px" }}>
              {filterTitles[activeFilter]} ({filteredProjects.length})
            </h3>
            <span onClick={() => setActiveFilter(null)}
              style={{ color: "#6b7280", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</span>
          </div>

          {filteredProjects.length === 0 ? (
            <p style={{ color: "#4b5563", padding: "22px", margin: 0, fontSize: "16px" }}>
              {allProjects.length === 0 ? "No projects in database yet." : "No projects match this filter."}
            </p>
          ) : (
            filteredProjects.map((p) => (
              <div 
              key={p._id} 
              style={{
              padding: "24px 28px", 
              borderBottom: "1px solid rgba(255,255,255,0.04)",
             }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#f8fafc", fontSize: "17px" }}>
                      {p.title}
                    </p>
                    <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "15px", lineHeight: "1.6" }}>
                      {p.description}
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                      <span style={{ color: "#a78bfa", fontWeight: "600" }}>Skills: </span>
                      {p.skillsRequired?.join(", ") || "None"}
                    </p>
                  </div>
                  <span style={{
                    background: p.status === "Open" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    color: p.status === "Open" ? "#10b981" : "#ef4444",
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    fontSize: "14px",
                    fontWeight: "bold", 
                    whiteSpace: "nowrap", 
                    marginLeft: "12px",
                    border: `1px solid ${p.status === "Open" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    flexShrink: 0
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "30px", 
        borderRadius: "16px",
      }}>
        <h3 style={{ color: "#fff", margin: "0 0 10px", fontSize: "22px" }}>Ready to collaborate?</h3>
        <p style={{ color: "#6b7280", margin: "0 0 22px", fontSize: "16px" }}>
          Browse open projects and apply to ones that match your skills.
        </p>
        <button onClick={() => navigate("/projects")} style={{
          padding: "14px 26px",
          background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
          color: "#ffffff", 
          border: "none", 
          borderRadius: "10px",
          cursor: "pointer", 
          fontWeight: "bold", 
          fontSize: "16px"
        }}>
          Explore Projects →
        </button>
      </div>
    </Layout>
  );
}