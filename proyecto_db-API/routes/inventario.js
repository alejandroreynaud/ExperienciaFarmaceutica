const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario');

router.post('/inventario', inventarioController.createInventario);
router.get('/inventario', inventarioController.getInventarios);

router.get('/inventario/:codigo', inventarioController.getInventarioByCodigo);
router.get("/bajo-stock", inventarioController.getBajoStock);
router.get("/proximos-vencer", inventarioController.getProximosVencer);



module.exports = router;
