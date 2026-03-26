const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController.js");

router.post("/clientes", clientesController.createCliente);
router.get("/clientes/:id", clientesController.getClienteById);
router.put("/clientes/:id", clientesController.updateCliente);

module.exports = router;