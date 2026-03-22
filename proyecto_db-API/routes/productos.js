const express = require("express");
const router = express.Router();
const productos = require("../controllers/productos");

router.post("/productos", productos.createProducto);
router.get("/productos", productos.getProductos);
router.get("/productos/getAll", productos.getProductos);
router.get("/productos/nombre/:nombre", productos.getProductoByName);
router.get("/productos/:nombre", productos.getProductoByName);
router.patch("/productos/:id", productos.updateProducto);
router.put("/productos/:id", productos.updateProducto);
router.patch("/productos/:id/desactivar", productos.desactivarProducto);
router.put("/productos/desactivar/:id", productos.desactivarProducto);
router.patch("/productos/:id/activar", productos.activarProducto);
router.put("/productos/activar/:id", productos.activarProducto);

module.exports = router;