const mongoose = require("mongoose");

const offersSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    tags: {
      type: String,
      required: true,
      trim: true,
    },
    offerquantity: {
      type: Number,
      required: true,
    },

    fabric: {
      type: String,
    },

    sizes: [String],

    colors: [String],

    image: {
      data: Buffer,
      contentType: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("offerproduct", offersSchema, "offerproduct");
