const express = require("express");
const router = express.Router();
const proveedoresController = require("../controllers/proveedoresController");

router.get("/proveedores", proveedoresController.getProveedores);
router.post("/proveedores", proveedoresController.createProveedor);
router.delete("/proveedores/:id", proveedoresController.deleteProveedor);

router.get("/proovedores", proveedoresController.getProveedores);
router.post("/proovedores", proveedoresController.createProveedor);
router.delete("/proovedores/:id", proveedoresController.deleteProveedor);

module.exports = router;
