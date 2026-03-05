const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");

router.get("/ventas", ventasController.getVentas);
router.get("/ventas/:id", ventasController.getVentaById);
router.post("/ventas", ventasController.createVenta);

module.exports = router;