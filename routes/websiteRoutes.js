const express = require("express");
const router = express.Router();

// Midlertidig lagring (senere bytter vi til database)
let websites = [
  { id: 1, name: "NAV", url: "https://www.nav.no", description: "Offentlig tjeneste" },
];

// LISTE
router.get("/", (req, res) => {
  res.render("websites/list", { title: "Nettsider", websites });
});

// NY NETTSIDE - FORM
router.get("/new", (req, res) => {
  res.render("websites/new", { title: "Legg til nettside" });
});

// NY NETTSIDE - SEND INN (POST)
router.post("/", (req, res) => {
  const { name, url, description } = req.body;

  const newWebsite = {
    id: Date.now(),
    name,
    url,
    description,
  };

  websites.push(newWebsite);
  res.redirect("/websites");
});

module.exports = router;