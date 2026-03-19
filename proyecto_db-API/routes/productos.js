const express = require("express");
const router = express.Router();
const productos = require("../controllers/productos");

router.post("/productos", productos.createProducto);
router.get("/productos/getAll", productos.getProductos);
router.get("/productos/:nombre", productos.getProductoByName);
router.put("/productos/:id", productos.updateProducto);
router.put("/productos/desactivar/:id", productos.desactivarProducto);
router.put("/productos/activar/:id", productos.activarProducto);

module.exports = router;