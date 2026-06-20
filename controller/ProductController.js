const Product = require("../model/product");
const Order = require("../model/ordermodel");
const Combo = require("../model/combomodel");
const generateSKU = require("../utils/generateSKU");
const OfferProduct = require("../model/offermodel");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      type, // NEW
      category,
      description,
      price,
      discountPrice,
      stock,
      fabric,
      sizes,
      colors,
      isActive,
    } = req.body;

    if (!name || !type || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "Name, type, price and stock required",
      });
    }

    const sku = generateSKU(category);

    let imageBase64 = "";

    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};
base64,
${req.file.buffer.toString("base64")}`;
    }

    const product = new Product({
      sku,
      name,
      type,
      category,
      description,
      price,
      discountPrice,
      stock,
      fabric,
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      image: imageBase64,
      isActive,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { isActive } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive },

      { new: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product status updated",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndUpdate(
      id,

      { isActive: false },
    );

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const hardDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .select("-image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,

        message: "Search query required",
      });
    }

    let filter = {
      $or: [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },

        {
          sku: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    };

    if (query.match(/^[0-9a-fA-F]{24}$/)) {
      filter.$or.push({
        _id: query,
      });
    }

    const totalResults = await Product.countDocuments(filter);

    const products = await Product.find(filter)

      .select("sku name category price stock isActive createdAt")

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .lean();

    res.json({
      success: true,

      count: products.length,

      totalResults,

      totalPages: Math.ceil(totalResults / limit),

      currentPage: page,

      hasNextPage: page < Math.ceil(totalResults / limit),

      hasPrevPage: page > 1,

      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getShopProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const { type, sort } = req.query;
    let filter = {
      isActive: true,
    };

    if (type && type !== "ALL") {
      filter.type = type;
    }

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "priceLow") {
      sortOption = { price: 1 };
    }

    if (sort === "priceHigh") {
      sortOption = { price: -1 };
    }

    if (sort === "topRated") {
      sortOption = { rating: -1 };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)

      .select(
        "sku name type category price discountPrice stock rating numReviews",
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// combo

const createCombo = async (req, res) => {
  try {
    const { name, products, originalPrice, comboPrice, type } = req.body;

    const sku = generateSKU("COMBO");

    let imageData = null;

    if (req.file) {
      imageData = {
        data: req.file.buffer,

        contentType: req.file.mimetype,
      };
    }

    const discount = Math.round(
      ((originalPrice - comboPrice) / originalPrice) * 100,
    );

    const combo = new Combo({
      name,
      sku,
      products,
      originalPrice,
      comboPrice,
      discount,
      image: imageData,
      type,
    });

    await combo.save();

    res.status(201).json({
      success: true,

      message: "Combo created",

      combo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getAllCombos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
    };

    const totalCombos = await Combo.countDocuments(filter);

    const combos = await Combo.find(filter)
      .populate("products", "name sku price discountPrice")
      .select("-image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: combos.length,
      totalCombos,
      totalPages: Math.ceil(totalCombos / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalCombos / limit),
      hasPrevPage: page > 1,
      combos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findById(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo not found",
      });
    }

    const {
      name,
      description,
      products,
      originalPrice,
      comboPrice,
      isActive,
    } = req.body;

    if (name) combo.name = name;

    if (description) combo.description = description;

    if (products) {
      combo.products =
        typeof products === "string"
          ? products.split(",").map((id) => id.trim())
          : products;
    }

    if (originalPrice) {
      combo.originalPrice = originalPrice;
    }

    if (comboPrice) {
      combo.comboPrice = comboPrice;
    }

    if (originalPrice || comboPrice) {
      combo.discount = Math.round(
        ((combo.originalPrice - combo.comboPrice) /
          combo.originalPrice) *
          100
      );
    }

    if (isActive !== undefined) {
      combo.isActive = isActive;
    }

    if (req.file) {
      combo.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await combo.save();

    res.status(200).json({
      success: true,
      message: "Combo updated successfully",
      combo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const softDeleteCombo = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Combo deleted successfully",
      combo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const hardDeleteCombo = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findByIdAndDelete(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Combo permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// offer

const createOffer = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      discountPrice,
      type,
      tags,
      offerquantity,
      fabric,
      sizes,
      colors,
      rating,
      numReviews,
      isActive,
    } = req.body;

    if (!name || !price || !offerquantity) {
      return res.status(400).json({
        success: false,

        message: "Name, price and quantity required",
      });
    }

    const sku = generateSKU("OFF");

    let imageData = null;

    if (req.file) {
      imageData = {
        data: req.file.buffer,

        contentType: req.file.mimetype,
      };
    }

    const offer = new OfferProduct({
      sku,
      name,
      category,
      description,
      price,
      discountPrice,
      type,
      tags,
      offerquantity,
      fabric,
      rating,
      numReviews,
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      image: imageData,
      isActive,
    });

    await offer.save();

    res.status(201).json({
      success: true,

      message: "Offer product created",

      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await OfferProduct.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,

        message: "Offer not found",
      });
    }

    const {
      name,
      category,
      description,
      price,
      discountPrice,
      type,
      tags,
      offerquantity,
      fabric,
      sizes,
      colors,
      rating,
      numReviews,
      isActive,
    } = req.body;

    if (name) offer.name = name;

    if (category) offer.category = category;

    if (description) offer.description = description;

    if (price) offer.price = price;

    if (discountPrice) offer.discountPrice = discountPrice;

    if (type) offer.type = type;

    if (tags) offer.tags = tags;

    if (offerquantity) offer.offerquantity = offerquantity;

    if (fabric) offer.fabric = fabric;

    if (rating) offer.rating = rating;

    if (numReviews) offer.numReviews = numReviews;

    if (isActive !== undefined) offer.isActive = isActive;

    if (sizes) {
      offer.sizes = sizes.split(",").map((s) => s.trim());
    }

    if (colors) {
      offer.colors = colors.split(",").map((c) => c.trim());
    }

    if (req.file) {
      offer.image = {
        data: req.file.buffer,

        contentType: req.file.mimetype,
      };
    }

    await offer.save();

    res.json({
      success: true,

      message: "Offer updated",

      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getAllOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
    };

    const totalOffers = await OfferProduct.countDocuments(filter);

    const offers = await OfferProduct.find(filter)

      .select(
        "sku name category price discountPrice offerquantity type rating tags createdAt",
      )

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .lean();

    res.json({
      success: true,
      count: offers.length,
      totalOffers,
      totalPages: Math.ceil(totalOffers / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalOffers / limit),
      hasPrevPage: page > 1,
      offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};


const softDeleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await OfferProduct.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const hardDeleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await OfferProduct.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer permanently deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//order

const createOrder = async (req, res) => {
  try {
    const { customerName, phone, productId, quantity } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({
        success: false,

        message: "Name and phone required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    const order = await Order.create({
      customerName,
      phone,
      product: productId,
      productName: product.name,
      price: product.discountPrice || product.price,
      quantity,
    });

    res.status(201).json({
      success: true,

      message: "Order created",

      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()

      .populate("product", "name sku price")

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .lean();

    res.json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalOrders / limit),
      hasPrevPage: page > 1,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getWeeklyOrdersGraph = async (req, res) => {
  try {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const today = new Date();

    const lastWeek = new Date();

    lastWeek.setDate(today.getDate() - 6);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: lastWeek,
            $lte: today,
          },
        },
      },

      {
        $group: {
          _id: {
            $dayOfWeek: "$createdAt",
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    let result = days.map((day, index) => {
      const found = orders.find((o) => o._id === index + 1);

      return {
        day,

        orders: found ? found.totalOrders : 0,
      };
    });

    res.json({
      success: true,

      weeklyOrders: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getMonthlyOrdersGraph = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const start = new Date(currentYear, 0, 1);

    const end = new Date(currentYear, 11, 31);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $group: {
          _id: {
            $month: "$createdAt",
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let result = months.map((month, index) => {
      const found = orders.find((o) => o._id === index + 1);

      return {
        month,

        orders: found ? found.totalOrders : 0,
      };
    });

    res.json({
      success: true,

      year: currentYear,

      monthlyOrders: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const getCategoryDistribution = async (req, res) => {
  try {
    const data = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData",
        },
      },

      {
        $unwind: "$productData",
      },

      {
        $group: {
          _id: "$productData.type",

          totalSold: {
            $sum: "$quantity",
          },
        },
      },

      {
        $sort: {
          totalSold: -1,
        },
      },
    ]);

    const total = data.reduce((sum, item) => sum + item.totalSold, 0);

    const result = data.map((item) => ({
      type: item._id,

      sold: item.totalSold,

      percentage: Math.round((item.totalSold / total) * 100),
    }));

    res.json({
      success: true,

      totalSold: total,

      categories: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};


const getDashboardStats = async (req, res) => {
  try {
    // Total Orders
    const totalOrders = await Order.countDocuments();

    // Total Revenue
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: ["$price", "$quantity"]
            }
          }
        }
      }
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    // Unique Customers (by phone number)
    const uniqueUsers = await Order.distinct("phone");

    const totalUsers = uniqueUsers.length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRevenue,
        totalOrders
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
module.exports = {
  createProduct,
  updateProductStatus,
  deleteProduct,
  hardDeleteProduct,
  getAllProducts,
  searchProducts,
  getShopProducts,
  createCombo,
  createOffer,
  updateOffer,
  getAllOffers,
  createOrder,
  getAllOrders,
  getWeeklyOrdersGraph,
  getMonthlyOrdersGraph,
  getCategoryDistribution,
  getDashboardStats,
    softDeleteOffer,
    hardDeleteOffer,
    getAllCombos,
    updateCombo,
    softDeleteCombo,
    hardDeleteCombo
};
