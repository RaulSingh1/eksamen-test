const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const websiteController = require("../controllers/websiteController");

// Liste er åpen for alle
router.get("/", websiteController.list);

// Bare innlogget kan legge til
router.get("/new", authController.requireLogin, websiteController.newPage);
router.post("/", authController.requireLogin, websiteController.create);

module.exports = router;
