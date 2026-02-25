const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const Website = require("../models/Website");
const Comment = require("../models/Comment");
const Report = require("../models/Report");

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

router.get("/", async (req, res) => {
  try {
    const websites = await Website.find()
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.render("reviews/list", { title: "Vurderinger", websites });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av vurderinger");
  }
});

router.get("/new", authController.requireLogin, (req, res) => {
  res.render("reviews/new", { title: "Ny vurdering", error: null });
});

router.post("/", authController.requireLogin, async (req, res) => {
  try {
    const { name, url, description, review, imageData } = req.body;
    if (!name || !url || !review) {
      return res.status(400).render("reviews/new", {
        title: "Ny vurdering",
        error: "Navn, link og vurdering er påkrevd.",
      });
    }

    await Website.create({
      name,
      url,
      description,
      review,
      imageData: imageData || "",
      user: req.session.user._id,
    });

    res.redirect("/reviews");
  } catch (err) {
    console.error(err);
    res.status(400).render("reviews/new", {
      title: "Ny vurdering",
      error: "Kunne ikke lagre vurderingen.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const website = await Website.findById(req.params.id).populate("user", "username");
    if (!website) return res.status(404).send("Fant ikke vurderingen");

    const allComments = await Comment.find({ website: req.params.id })
      .populate("user", "username")
      .sort({ createdAt: 1 });

    const comments = allComments.filter((comment) => !comment.parentComment);
    const repliesByParent = {};
    for (const comment of allComments) {
      if (!comment.parentComment) continue;
      const parentId = String(comment.parentComment);
      if (!repliesByParent[parentId]) repliesByParent[parentId] = [];
      repliesByParent[parentId].push(comment);
    }

    res.render("reviews/show", {
      title: website.name,
      website,
      comments,
      repliesByParent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved henting av vurdering");
  }
});

router.post("/:id/delete", authController.requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).send("Fant ikke vurderingen");
    if (String(website.user) !== String(req.session.user._id)) {
      return res.status(403).send("Du kan bare slette dine egne vurderinger.");
    }

    await Comment.deleteMany({ website: req.params.id });
    await Report.deleteMany({ website: req.params.id });
    await Website.findByIdAndDelete(req.params.id);
    res.redirect("/reviews");
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved sletting av vurdering");
  }
});

router.post("/:id/like", authController.requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).send("Fant ikke vurderingen");
    applyVoteToggle(website, req.session.user._id, "like");
    await website.save();
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved tommel opp");
  }
});

router.post("/:id/dislike", authController.requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).send("Fant ikke vurderingen");
    applyVoteToggle(website, req.session.user._id, "dislike");
    await website.save();
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved tommel ned");
  }
});

router.post("/:id/comment", authController.requireLogin, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    const parentCommentId = req.body.parentCommentId || null;
    if (!text) return res.redirect(`/reviews/${req.params.id}`);

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
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved lagring av kommentar");
  }
});

router.post("/:id/comments/:commentId/like", authController.requireLogin, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.commentId, website: req.params.id });
    if (!comment) return res.status(404).send("Fant ikke kommentar");
    applyVoteToggle(comment, req.session.user._id, "like");
    await comment.save();
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved tommel opp på kommentar");
  }
});

router.post("/:id/comments/:commentId/dislike", authController.requireLogin, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.commentId, website: req.params.id });
    if (!comment) return res.status(404).send("Fant ikke kommentar");
    applyVoteToggle(comment, req.session.user._id, "dislike");
    await comment.save();
    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved tommel ned på kommentar");
  }
});

router.post("/:id/report", authController.requireLogin, async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).send("Fant ikke vurderingen");
    }

    const comment = (req.body.comment || "").trim();
    if (!comment) {
      return res.redirect(`/reviews/${req.params.id}`);
    }

    await Report.findOneAndUpdate(
      { website: req.params.id, reportedBy: req.session.user._id },
      {
        website: req.params.id,
        reportedBy: req.session.user._id,
        comment,
        status: "open",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.redirect(`/reviews/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Feil ved rapportering");
  }
});

module.exports = router;
