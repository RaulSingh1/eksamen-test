const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("reviews/list", { title: "Vurderinger" });
});

router.get("/new", (req, res) => {
  res.render("reviews/new", { title: "Skriv vurdering" });
});

module.exports = router;