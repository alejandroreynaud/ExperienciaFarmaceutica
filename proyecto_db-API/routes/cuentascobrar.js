const express = require("express");
const router = express.Router();
const cuentascobrarController = require("../controllers/cuentascobrarController"); 

router.get("/cuentascobrar/:id", getCuentaCobrarById);

module.exports = router;