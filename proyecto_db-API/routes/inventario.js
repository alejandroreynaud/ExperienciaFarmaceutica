const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario');

router.post('/inventario', inventarioController.createInventario);
router.get('/inventario', inventarioController.getInventarios);
router.get('/inventario/:id', inventarioController.getInventarioById);

module.exports = router;
