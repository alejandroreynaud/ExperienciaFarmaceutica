const express = require("express");
const router = express.Router();
const cuentascobrarController = require("../controllers/cuentascobrarController"); 

router.get("/cuentascobrar/:id", cuentascobrarController.getCuentaCobrarById);
router.post("/cuentas-cobrar/:id", cuentascobrarController.createCuentaCobrar);
router.put("/cuentas-cobrar/:id", cuentascobrarController.updateCuentaCobrar);

module.exports = router;