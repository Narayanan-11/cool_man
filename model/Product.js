const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
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
      index: true,
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

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    fabric: {
      type: String,
    },

    sizes: [String],

    colors: [String],

    image: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      //   trim: true,
      //   index: true,
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
