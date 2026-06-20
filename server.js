const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ProductRouter = require("./router/ProductRouter");

const connectDB = require("./database/db");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();
app.get("/", (req, res) => {
  res.send("API Running");
});

app.use("/api/products", ProductRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
