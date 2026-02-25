const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const Report = require("../models/Report");
const Website = require("../models/Website");
const Comment = require("../models/Comment");

router.use(authController.requireAdmin);

router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reportedBy", "username")
      .populate({
        path: "website",
        populate: { path: "user", select: "username" },
      })
      .sort({ createdAt: -1 });

    res.render("admin/reports", { title: "Admin - Rapporter", reports });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av rapporter");
  }
});

router.post("/reports/:id/resolve", async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { status: "handled" });
    res.redirect("/admin/reports");
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved oppdatering av rapport");
  }
});

router.post("/reviews/:id/delete", async (req, res) => {
  try {
    await Comment.deleteMany({ website: req.params.id });
    await Report.deleteMany({ website: req.params.id });
    await Website.findByIdAndDelete(req.params.id);
    res.redirect("/admin/reports");
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved sletting av post");
  }
});

module.exports = router;
