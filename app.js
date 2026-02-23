require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const indexRoutes = require("./routes/indexRoutes");
const authRoutes = require("./routes/authRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/", indexRoutes);
app.use("/auth", authRoutes);
app.use("/websites", websiteRoutes);
app.use("/reviews", reviewRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
});