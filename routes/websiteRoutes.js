const express = require("express");
const router = express.Router();

const Website = require("../models/Website");
const Comment = require("../models/Comment");

// ✅ Enkel auth middleware (bruker session)
function requireLogin(req, res, next) {
  // Du har res.locals.user = req.session.user || null i app.js
  // så vi bruker req.session.user her
  if (!req.session.user) return res.redirect("/auth/login");
  next();
}

function hasUser(voterList, userId) {
  return (voterList || []).some((id) => String(id) === String(userId));
}

function removeUser(voterList, userId) {
  return (voterList || []).filter((id) => String(id) !== String(userId));
}

function applyVoteToggle(entity, userId, direction) {
  const liked = hasUser(entity.likedBy, userId);
  const disliked = hasUser(entity.dislikedBy, userId);

  if (direction === "like") {
    if (liked) {
      entity.likedBy = removeUser(entity.likedBy, userId);
      entity.likes = Math.max((entity.likes || 0) - 1, 0);
      return;
    }

    entity.likedBy = [...(entity.likedBy || []), userId];
    entity.likes = (entity.likes || 0) + 1;

    if (disliked) {
      entity.dislikedBy = removeUser(entity.dislikedBy, userId);
      entity.dislikes = Math.max((entity.dislikes || 0) - 1, 0);
    }
    return;
  }

  if (disliked) {
    entity.dislikedBy = removeUser(entity.dislikedBy, userId);
    entity.dislikes = Math.max((entity.dislikes || 0) - 1, 0);
    return;
  }

  entity.dislikedBy = [...(entity.dislikedBy || []), userId];
  entity.dislikes = (entity.dislikes || 0) + 1;

  if (liked) {
    entity.likedBy = removeUser(entity.likedBy, userId);
    entity.likes = Math.max((entity.likes || 0) - 1, 0);
  }
}

// LISTE
router.get("/", async (req, res) => {
  try {
    const websites = await Website.find()
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.render("websites/list", { title: "Nettsider", websites });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av nettsider");
  }
});

// NY NETTSIDE - FORM (kun innlogget)
router.get("/new", requireLogin, (req, res) => {
  res.render("websites/new", { title: "Legg til nettside", error: null });
});

// SLETT NETTSIDE/VURDERING (kun eier)
router.post("/:id/delete", requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).send("Fant ikke nettsiden");
    }

    if (String(website.user) !== String(req.session.user._id)) {
      return res.status(403).send("Du kan bare slette dine egne vurderinger.");
    }

    await Comment.deleteMany({ website: req.params.id });
    await Website.findByIdAndDelete(req.params.id);
    res.redirect("/websites");
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved sletting av nettside");
  }
});

// ENKEL NETTSIDE
router.get("/:id", async (req, res) => {
  try {
    const website = await Website.findById(req.params.id).populate("user", "username");
    if (!website) {
      return res.status(404).send("Fant ikke nettsiden");
    }

    const allComments = await Comment.find({ website: req.params.id })
      .populate("user", "username")
      .sort({ createdAt: 1 });

    const topLevelComments = allComments.filter((comment) => !comment.parentComment);
    const repliesByParent = {};

    for (const comment of allComments) {
      if (!comment.parentComment) continue;
      const parentId = String(comment.parentComment);
      if (!repliesByParent[parentId]) repliesByParent[parentId] = [];
      repliesByParent[parentId].push(comment);
    }

    res.render("websites/show", {
      title: website.name,
      website,
      comments: topLevelComments,
      repliesByParent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av nettside");
  }
});

router.post("/:id/like", requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).send("Fant ikke nettsiden");

    applyVoteToggle(website, req.session.user._id, "like");
    await website.save();
    res.redirect(`/websites/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved registrering av tommel opp");
  }
});

router.post("/:id/dislike", requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).send("Fant ikke nettsiden");

    applyVoteToggle(website, req.session.user._id, "dislike");
    await website.save();
    res.redirect(`/websites/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved registrering av tommel ned");
  }
});

router.post("/:id/comment", requireLogin, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    const parentCommentId = req.body.parentCommentId || null;
    if (!text) {
      return res.redirect(`/websites/${req.params.id}`);
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || String(parentComment.website) !== String(req.params.id)) {
        return res.status(400).send("Ugyldig kommentar-svar.");
      }
    }

    await Comment.create({
      text,
      user: req.session.user._id,
      website: req.params.id,
      parentComment: parentCommentId,
    });

    res.redirect(`/websites/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved lagring av kommentar");
  }
});

router.post("/:id/comments/:commentId/like", requireLogin, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      website: req.params.id,
    });
    if (!comment) return res.status(404).send("Fant ikke kommentar");

    applyVoteToggle(comment, req.session.user._id, "like");
    await comment.save();

    res.redirect(`/websites/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved registrering av tommel opp på kommentar");
  }
});

router.post("/:id/comments/:commentId/dislike", requireLogin, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      website: req.params.id,
    });
    if (!comment) return res.status(404).send("Fant ikke kommentar");

    applyVoteToggle(comment, req.session.user._id, "dislike");
    await comment.save();

    res.redirect(`/websites/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved registrering av tommel ned på kommentar");
  }
});

// NY NETTSIDE - SEND INN (kun innlogget)
router.post("/", requireLogin, async (req, res) => {
  try {
    const { name, url, description, review, imageData } = req.body;
    if (!name || !url || !review) {
      return res.status(400).render("websites/new", {
        title: "Legg til nettside",
        error: "Navn, link og vurdering er påkrevd.",
      });
    }

    const website = new Website({
      name,
      url,
      description,
      review,
      imageData: imageData || "",
      user: req.session.user._id, // 👈 viktig
    });

    await website.save();
    res.redirect("/websites");
  } catch (err) {
    console.error(err);
    res.status(400).render("websites/new", {
      title: "Legg til nettside",
      error: "Kunne ikke lagre nettsiden. Sjekk feltene.",
    });
  }
});

module.exports = router;
