const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");

router.get("/compras", comprasController.getCompras);
router.get("/compras/resumen", comprasController.getComprasResumen);
router.post("/compras", comprasController.createCompra);
router.get("/compras/fecha", comprasController.getComprasByFecha);

module.exports = router;