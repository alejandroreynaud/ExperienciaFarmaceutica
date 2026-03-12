const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');
router.post('/facturas', facturasController.createFactura);
router.get('/facturas/fecha', facturasController.getFacturasFecha);
router.get('/facturas/:id', facturasController.getFacturaId);

module.exports = router;