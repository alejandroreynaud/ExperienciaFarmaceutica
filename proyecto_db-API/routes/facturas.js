const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');
router.post('/facturas', facturasController.createFactura);
router.get('/facturas/fecha', facturasController.getFacturasFecha);
router.get('/facturas/:num_factura', facturasController.getFacturaByNumero);

module.exports = router;