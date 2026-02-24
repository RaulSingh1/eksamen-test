const User = require("../models/User");

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
};

/* GET REGISTER */
exports.registerPage = (req, res) => {
  res.render("auth/register", { error: null });
};

/* POST REGISTER */
exports.register = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username || !email || !password || !passwordConfirm) {
      return res.render("auth/register", { error: "Fyll ut alle feltene" });
    }

    if (password !== passwordConfirm) {
      return res.render("auth/register", { error: "Passordene er ikke like" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.render("auth/register", {
        error: "Email finnes allerede"
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.render("auth/register", {
        error: "Brukernavn finnes allerede"
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email
    };

    res.redirect("/");
  } catch (err) {
    res.render("auth/register", { error: err.message });
  }
};

/* GET LOGIN */
exports.loginPage = (req, res) => {
  res.render("auth/login", { error: null });
};

/* POST LOGIN */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login", {
        error: "Bruker finnes ikke"
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.render("auth/login", {
        error: "Feil passord"
      });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email
    };

    res.redirect("/");
  } catch (err) {
    res.render("auth/login", { error: err.message });
  }
};

/* LOGOUT */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};
