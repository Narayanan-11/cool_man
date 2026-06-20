const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");
const productController = require("../controller/ProductController");

router.post("/create", upload.single("image"), productController.createProduct);
router.put("/statusdelee/:id", productController.updateProductStatus);
router.put("/delete/:id", productController.deleteProduct);
router.delete("/hard-delete/:id", productController.hardDeleteProduct);
router.get("/getAllproducts", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/shop", productController.getShopProducts);

// combo routes

router.post(
  "/create-combo",
  upload.single("image"),
  productController.createCombo,
);
router.get("/getallcombos", productController.getAllCombos);

router.put(
  "/updatecombo/:id",
  upload.single("image"),
  productController.updateCombo,
);

router.put("/soft-deletecombo/:id", productController.softDeleteCombo);

router.delete("/hard-delete/:id", productController.hardDeleteCombo);

// offer routes
router.post("/create-offer", productController.createOffer);

router.put("/getAllOffers", productController.updateOffer);

router.get("/getAllOffers", productController.getAllOffers);

router.put("/soft-delete/:id", productController.softDeleteOffer);

router.delete("/hard-delete/:id", productController.hardDeleteOffer);

// order routes
router.post("/create-order", productController.createOrder);

router.get("/weekly-orders-graph", productController.getWeeklyOrdersGraph);
router.get("/monthly-graph", productController.getMonthlyOrdersGraph);
router.get("/category-distribution", productController.getCategoryDistribution);
router.get("/dashboard-stats", productController.getDashboardStats);
module.exports = router;
