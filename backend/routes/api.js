const express = require("express");

const router = express.Router();

const products = require("./api/product.route");

router.use("/products", products);

module.exports = router;