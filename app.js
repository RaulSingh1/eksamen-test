require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");

const app = express();

// ✅ LOGG ALLE REQUESTS (VIKTIG)
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

// ✅ MongoDB (ikke blokk server om den feiler)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.send("SERVER FUNGERER");
});

// Routes
const indexRoutes = require("./routes/indexRoutes");
const authRoutes = require("./routes/authRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/", indexRoutes);
app.use("/auth", authRoutes);
app.use("/websites", websiteRoutes);
app.use("/reviews", reviewRoutes);

// ✅ 404 hvis ingen routes matcher
app.use((req, res) => {
  res.status(404).send("404 - Ingen route");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR:", err);
  res.status(500).send("500 - Server error");
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server kjører på http://127.0.0.1:${PORT}`);
});