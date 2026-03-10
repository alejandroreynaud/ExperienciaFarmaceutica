const { Compra } = require("../models");



let getComprasByFecha = async (request, response) => {
    try {

        const { fecha } = request.query;

        if (!fecha) {
            return response.status(400).json({
                status: 400,
                message: "Debe enviar una fecha"
            });
        }

        let compras = await Compra.findAll({
            where: {
                fecha: fecha
            }
        });

        if (compras.length <= 0) {

            return response.status(204).json({
                status: 204,
                message: "No se encontraron compras para esa fecha"
            });

        }

        response.status(200).json({
            status: 200,
            data: compras
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let createCompra = async (request, response) => {
    try {

        // Recibir datos del body
        const { proveedor_id, fecha, total } = request.body;

        // Validar datos
        if (!proveedor_id || !fecha || !total) {
            return response.status(400).json({
                status: 400,
                message: "Proveedor, fecha y total son obligatorios"
            });
        }

        // Guardar compra en base de datos
        let compra = await Compra.create({
            proveedor_id,
            fecha,
            total
        });

        response.status(201).json({
            status: 201,
            message: "Compra registrada correctamente",
            data: compra
        });

    } catch (error) {

        // Manejo de errores
        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};


module.exports = {
    getComprasByFecha,
    createCompra
};