const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    github: { type: String, default: "" },

    // NEW: owner can create projects, collaborator can apply
    role: {
      type: String,
      enum: ["admin", "collaborator"],
      default: "collaborator",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);