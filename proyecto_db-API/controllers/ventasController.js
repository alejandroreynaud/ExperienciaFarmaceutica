const { Venta } = require("../models");

let getVentas = async (request, response) => {
    try {

        let ventas = await Venta.findAll();

        if (ventas.length <= 0) {

            response.status(204).json({
                status: 204,
                message: "No se encontraron ventas"
            });

        } else {

            response.status(200).json({
                status: 200,
                data: ventas
            });

        }

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let getVentaById = async (request, response) => {
    try {

        let venta = await Venta.findByPk(request.params.id);

        if (!venta) {

            response.status(204).json({
                status: 204,
                message: "Venta no encontrada"
            });

        } else {

            response.status(200).json({
                status: 200,
                data: venta
            });

        }

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let createVenta = async (request, response) => {
    try {

        let venta = await Venta.create(request.body);

        response.status(200).json({
            status: 200,
            data: venta
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

module.exports = {
    getVentas,
    getVentaById,
    createVenta
};