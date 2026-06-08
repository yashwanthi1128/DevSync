import { useState, useMemo, useRef, useCallback } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./CreateProject.css";

const SKILLS_LIST = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "Figma", 
  "AWS", "Docker", "MongoDB", "PostgreSQL", "Flutter", "Next.js", 
  "Vue", "Angular", "Go", "Rust", "Kubernetes", "GraphQL", "Tailwind",
  "Redux", "Express", "Django", "FastAPI", "Firebase", "Git", "CI/CD",
  "HTML", "CSS", "Sass", "jQuery", "Bootstrap", "Material-UI", "MySQL"
];

export default function CreateProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skillInputRef = useRef(null);
  const navigate = useNavigate();

  const suggestions = useMemo(() => {
    if (skillInput.length < 2) return [];
    const lower = skillInput.toLowerCase();
    return SKILLS_LIST.filter(
      s => s.toLowerCase().includes(lower) && !skills.includes(s)
    ).slice(0, 5);
  }, [skillInput, skills]);

  const addSkill = useCallback((skill = null) => {
    const t = skill || skillInput.trim();
    if (t && !skills.includes(t)) {
      setSkills(prev => [...prev, t]);
      setSkillInput("");
      setShowSuggestions(false);
      skillInputRef.current?.focus();
    }
  }, [skillInput, skills]);

  const removeSkill = useCallback((s) => {
    setSkills(prev => prev.filter(sk => sk !== s));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setSuccess("");
    setLoading(true);
    try {
      await API.post("/projects", { title, description, skillsRequired: skills });
      setSuccess("Project created successfully!");
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Create New Project</h1>
        <p>Post a project and find collaborators</p>
      </div>

      <div className="project-card glass-card">
        <form onSubmit={handleSubmit} className="project-form">

          <div className="form-field">
            <label className="form-label">Project Title</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Resume Builder" 
              required 
              className="form-input" 
            />
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?" 
              required 
              rows={4}
              className="form-input form-textarea" 
            />
          </div>

          <div className="form-field">
            <label className="form-label">Skills Required</label>
            <div className="skill-input-wrap">
              <input 
                ref={skillInputRef}
                value={skillInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSkillInput(val);
                  setShowSuggestions(val.length >= 2);
                }}
                onKeyDown={(e) => { 
                  if (e.key === "Enter") { 
                    e.preventDefault(); 
                    addSkill(); 
                  }
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                onFocus={() => skillInput.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type 2+ letters for suggestions"
                className="form-input skill-input"
                autoComplete="off"
              />
              <button type="button" onClick={() => addSkill()} className="skill-add-btn">+ Add</button>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="skill-suggestions">
                {suggestions.map(s => (
                  <div 
                    key={s} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(s);
                    }} 
                    className="skill-suggestion"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
            
            <div className="skill-tags">
              {skills.map((s) => (
                <span key={s} className="skill-tag">
                  {s}
                  <span onClick={() => removeSkill(s)} className="skill-remove">×</span>
                </span>
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <div className="form-actions">
            <button 
              
              type="button" 
              onClick={() => navigate("/admin")} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}