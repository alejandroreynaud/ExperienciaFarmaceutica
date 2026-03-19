const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");

router.get("/ventas", ventasController.getVentasFecha);
router.get("/ventas/cliente/:id_cliente", ventasController.getVentasByCliente);
router.get("/ventas/:id", ventasController.getVentaById);
router.post("/ventas", ventasController.createVenta);
router.get("/semanal", ventasController.getVentasSemanal);
router.get("/mensual", ventasController.getVentasMensual);

module.exports = router;