const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Llegaste a la ruta de productos");
});

module.exports = router;