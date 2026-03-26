const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario');

router.post('/products', inventarioController.createInventario);
router.get('/products', inventarioController.getInventarios);
router.get('/products/:codigo', inventarioController.getInventarioByCodigo);
router.put('/products/:id', inventarioController.updateInventario);
router.get('/products/alertas/por-vencer', inventarioController.getAlertasPorVencer);
router.get('/products/reporte/stock-total', inventarioController.getReporteStockTotal);
//router.get('/products/alertas/bajo-stock', inventarioController.getAlertasBajoStock);

module.exports = router;
