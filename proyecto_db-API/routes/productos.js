const express = require("express");
const router = express.Router();
const productos = require("../controllers/productos");

router.post("/productos", productos.createProducto);
router.get("/productos/getAll", productos.getProductos);
router.get("/productos/:nombre", productos.getProductoByName);

module.exports = router;