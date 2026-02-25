require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const app = express();

/* =======================
   DB
======================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* =======================
   VIEW ENGINE
======================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =======================
   MIDDLEWARE
======================= */
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));


app.use(session({
  secret: process.env.SESSION_SECRET || "change-me-in-env",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* =======================
   ROUTES
======================= */
const authRoutes = require("./routes/authRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const faqRoutes = require("./routes/faqRoutes");

app.use("/auth", authRoutes);
app.use("/websites", websiteRoutes);
app.use("/reviews", reviewRoutes);
app.use("/admin", adminRoutes);
app.use("/faq", faqRoutes);

app.get("/", (req, res) => {
  res.render("index", { title: "Forside" });
});
/* =======================
   START
======================= */
app.listen(process.env.PORT, () => {
  console.log("Server kjører på http://localhost:3000");
});
