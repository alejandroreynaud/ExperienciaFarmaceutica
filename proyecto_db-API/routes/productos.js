const express = require("express");
const router = express.Router();
const productos = require("../controllers/productos");

router.post("/productos", productos.createProducto);

module.exports = router;