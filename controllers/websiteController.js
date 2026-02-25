const Website = require("../models/Website");

// GET /websites
exports.list = async (req, res) => {
  const websites = await Website.find()
    .populate("user", "username")
    .sort({ createdAt: -1 });

  res.render("websites/list", { title: "Nettsider", websites });
};

// GET /websites/new
exports.newPage = (req, res) => {
  res.render("websites/new", { title: "Legg til nettside", error: null });
};

// POST /websites
exports.create = async (req, res) => {
  try {
    const { name, url, description } = req.body;

    await Website.create({
      name,
      url,
      description,
      user: req.session.user._id,
    });

    res.redirect("/websites");
  } catch (err) {
    res.render("websites/new", { title: "Legg til nettside", error: err.message });
  }
};
