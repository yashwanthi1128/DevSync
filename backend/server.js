const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");


dotenv.config();

const app = express();
const server = http.createServer(app);


// middleware — order matters
app.use(cors({
  origin: ["http://localhost:3000", "https://devsync-my-frontend.onrender.com"],
  credentials: true
}));

// ADD THESE 2 LINES - this fixes req.body undefined
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// DB connection
const connectDB = require("./config/db");
connectDB();



// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

// route usage
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// home route
app.get("/", (req, res) => {
  res.send("DevSync API Running...");
});

// start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});