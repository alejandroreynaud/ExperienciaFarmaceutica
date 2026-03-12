const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');
router.post('/facturas', facturasController.createFactura);
router.get('/facturas/fecha', facturasController.getFacturasPorFecha);
router.get('/facturas/:id', facturasController.getFacturaById);

module.exports = router;