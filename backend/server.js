const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// middleware — cors MUST be before express.json() and routes
app.use(cors({
  origin: ["http://localhost:3000", "https://devsync-frontend-ey4r.onrender.com"],
  credentials: true
}));
app.use(express.json());

// DB connection
const connectDB = require("./config/db");
connectDB();

// routes
const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

// route usage
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/projects", projectRoutes);

// home route
app.get("/", (req, res) => {
  res.send("DevSync API Running...");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});