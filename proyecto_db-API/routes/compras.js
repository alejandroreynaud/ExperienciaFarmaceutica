const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");

router.get("/compras/resumen", comprasController.getResumen);
router.get("/compras/fecha",   comprasController.getComprasByFecha);
router.get("/compras/:id",     comprasController.getCompraById);
router.get("/compras",         comprasController.getCompras);
router.post("/compras",        comprasController.createCompra);

module.exports = router;