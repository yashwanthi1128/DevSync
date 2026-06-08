const Project = require("../models/Project");

exports.getProjects = async (req, res) => {
  try {
    console.log("getProjects called");
    const projects = await Project.find()
      .populate("createdBy", "name email")
      .populate("applications", "name email")
      .populate("collaborators", "name email")
      .lean();

    console.log("Found projects:", projects.length);

    const safeProjects = projects.map(p => ({
      ...p,
      createdBy: p.createdBy || { name: "Deleted User", email: "" },
      status: p.status || "Open",
      rejected: p.rejected || [],
      applications: p.applications || [],
      collaborators: p.collaborators || [],
      skillsRequired: p.skillsRequired || []
    }));

    res.status(200).json({ success: true, projects: safeProjects });
  } catch (error) {
    console.log("getProjects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, skillsRequired } = req.body;
    const project = await Project.create({
      title, description, skillsRequired,
      createdBy: req.user.id,
      status: "Open",
      applications: [],
      collaborators: [],
      rejected: [],
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('collaborators', 'name email')
      .populate('applications', 'name email');
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const alreadyApplied = project.applications.some(id => id.toString() === req.user.id);
    if (alreadyApplied) return res.status(400).json({ success: false, message: "Already applied" });
    project.applications.push(req.user.id);
    await project.save();
    res.status(200).json({ success: true, message: "Application submitted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptApplication = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const userId = req.params.userId;
    project.collaborators.push(userId);
    project.applications = project.applications.filter(id => id.toString() !== userId);
    await project.save();
    res.status(200).json({ success: true, message: "User accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectApplication = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const userId = req.params.userId;
    project.applications = project.applications.filter(id => id.toString() !== userId);
    if (!project.rejected) project.rejected = [];
    project.rejected.push(userId);
    await project.save();
    res.status(200).json({ success: true, message: "Application rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProject = async (req, res) => {
  try {
    const { title, description, skillsRequired } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, skillsRequired },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  
};