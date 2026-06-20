const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    productName: String,

    price: Number,

    quantity: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONTACTED", "CONFIRMED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema,"Order");
