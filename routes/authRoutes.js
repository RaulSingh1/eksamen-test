const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("auth/login", { title: "Logg inn" });
});

router.get("/register", (req, res) => {
  res.render("auth/register", { title: "Registrer" });
});

module.exports = router;