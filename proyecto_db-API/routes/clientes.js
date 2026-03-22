const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController");
const { getClienteById, createCliente, updateCliente } = require("../controllers/clientesController");

router.post("/clientes", clientesController.createCliente);
router.get("/clientes/:id", clientesController.getClienteById);
router.put("/clientes/:id", updateCliente);

module.exports = router;