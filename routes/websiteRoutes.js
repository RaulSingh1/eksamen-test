const express = require("express");
const router = express.Router();
const Website = require("../models/Website");

router.get("/", async (req, res) => {
  try {
    const websites = await Website.find()
      .populate("user", "username")
      .sort({ name: 1 });

    res.render("websites/list", { title: "Nettsider", websites });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av nettsider");
  }
});

module.exports = router;
