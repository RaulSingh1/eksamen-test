const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "handled"],
      default: "open",
    },
  },
  { timestamps: true }
);

reportSchema.index({ website: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
