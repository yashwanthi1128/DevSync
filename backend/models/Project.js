const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    skillsRequired: { type: [String], default: [] },
    status: { type: String, default: "Open" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    collaborators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    applications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // NEW: track rejected users
    rejected: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);