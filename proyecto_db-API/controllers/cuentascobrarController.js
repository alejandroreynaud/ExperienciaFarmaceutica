const { CuentaCobrar, Cliente } = require("../models");

let getCuentaCobrarById = async (request, response) => {
    try {

        const id = request.params.id;

        let cuenta = await CuentaPorCobrar.findByPk(id, {
            include: [
                {
                    model: Cliente,
                    as: "Cliente",
                    attributes: ["id", "nombre", "identidad", "RTN", "telefono"]
                },
                {
                    model: Factura,
                    as: "Factura"
                }
            ]
        });

        if (!cuenta) {
            return response.status(404).json({
                status: 404,
                message: "Cuenta por cobrar no encontrada"
            });
        }

        response.status(200).json({
            status: 200,
            data: cuenta
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let createCuentaCobrar = async (request, response) => {
    try {

        const id_cliente = request.params.id;

        // Verificar que el cliente existe
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return response.status(404).json({
                status: 404,
                message: "Cliente no encontrado"
            });
        }

        const { id_factura, saldo_pendiente, estado, fecha_creado } = request.body;

        // Validar campos obligatorios
        if (!id_factura || saldo_pendiente === undefined) {
            return response.status(400).json({
                status: 400,
                message: "id_factura y saldo_pendiente son obligatorios"
            });
        }

        if (isNaN(saldo_pendiente) || saldo_pendiente < 0) {
            return response.status(400).json({
                status: 400,
                message: "El saldo_pendiente debe ser un número mayor o igual a 0"
            });
        }

        // Verificar que la factura existe
        const factura = await Factura.findByPk(id_factura);
        if (!factura) {
            return response.status(404).json({
                status: 404,
                message: "Factura no encontrada"
            });
        }

        // Verificar que la factura no tenga ya una cuenta por cobrar
        const cuentaExistente = await CuentaPorCobrar.findOne({ where: { id_factura } });
        if (cuentaExistente) {
            return response.status(400).json({
                status: 400,
                message: "Esta factura ya tiene una cuenta por cobrar asignada"
            });
        }

        let cuenta = await CuentaPorCobrar.create({
            id_cliente,
            id_factura,
            saldo_pendiente,
            estado: estado ?? true,
            fecha_creado: fecha_creado || new Date()
        });

        response.status(201).json({
            status: 201,
            message: "Cuenta por cobrar creada correctamente",
            data: cuenta
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};





module.exports = {
    getCuentaCobrarById,
    createCuentaCobrar,
    updateCuentaCobrar
};