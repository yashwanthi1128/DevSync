const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection
const connectDB = require("./config/db");
connectDB();

// routes
const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
  res.send("DevSync API Running...");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});