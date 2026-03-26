const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario');

router.post('/products', inventarioController.createInventario);
router.get('/products', inventarioController.getInventarios);
router.get('/products/:codigo', inventarioController.getInventarioByCodigo);
router.put('/products/:id', inventarioController.updateInventario);
router.get('/products/alertas/por-vencer', inventarioController.getAlertasPorVencer);
router.get('/products/reporte/stock-total', inventarioController.getReporteStockTotal);
router.get('/export/pdf', inventarioController.exportInventarioPDF);
router.get('/export/pdf/expiring', inventarioController.exportExpiringPDF);
router.get('/export/pdf/low-stock', inventarioController.exportLowStockPDF);
router.get('/products/alertas/bajo-stock', inventarioController.getAlertasBajoStock);

module.exports = router;
