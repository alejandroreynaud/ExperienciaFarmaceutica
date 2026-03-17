const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario');

router.post('/inventario', inventarioController.createInventario);
router.get('/inventario', inventarioController.getInventarios);

router.get('/inventario/:codigo', inventarioController.getInventarioByCodigo);

module.exports = router;
