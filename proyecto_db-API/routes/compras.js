const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");

router.post("/compras", comprasController.createCompra);
router.get("/compras/fecha", comprasController.getComprasByFecha);

module.exports = router;