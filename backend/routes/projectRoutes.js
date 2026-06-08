const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const protect = require("../middleware/authMiddleware");

console.log("Routes: getProjects =", typeof projectController.getProjects);

// Public
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);

// Protected
router.post("/", protect, projectController.createProject);
router.post("/:id/apply", protect, projectController.applyToProject);
router.post("/:id/accept/:userId", protect, projectController.acceptApplication);
router.post("/:id/reject/:userId", protect, projectController.rejectApplication);
router.delete("/:id", protect, projectController.deleteProject);

// NEW: update project
router.put("/:id", protect, projectController.updateProject);

module.exports = router;