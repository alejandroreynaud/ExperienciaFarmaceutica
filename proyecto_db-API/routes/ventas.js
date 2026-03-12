const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");

router.get("/ventas", ventasController.getVentasFecha);
router.get("/ventas/:id", ventasController.getVentaById);
router.post("/ventas", ventasController.createVenta);
router.get("/ventas/cliente/:id_cliente", ventasController.getVentasByCliente);


module.exports = router;