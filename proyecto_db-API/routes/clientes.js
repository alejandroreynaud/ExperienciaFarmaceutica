const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController");

router.post("/clientes", clientesController.createCliente);
router.get("/clientes/:id", clientesController.getClienteById);

module.exports = router;