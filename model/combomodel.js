const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      unique: true,
      required: true,
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    originalPrice: {
      type: Number,
      required: true,
    },

    comboPrice: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
    },

    image: {
      data: Buffer,
      contentType: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    type: {
      type: String,
      enum: ["COMBO", "OFFER"],
      default: "COMBO",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Combo", comboSchema);
