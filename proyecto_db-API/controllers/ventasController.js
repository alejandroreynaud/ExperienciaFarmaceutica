const { Venta, sequelize } = require("../models");

let getVentasFecha = async (request, response) => {
    try {

        let ventas;

        if (request.query.fecha) {

            ventas = await Venta.findAll({
                where: sequelize.where(
                    sequelize.fn('DATE', sequelize.col('fecha')),
                    request.query.fecha
                )
            });

        } else {

            ventas = await Venta.findAll();

        }

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
let getVentasByCliente = async (request, response) => {
    try {

        const { id_cliente } = request.params;

        let ventas = await Venta.findAll({
            where: {
                id_cliente: id_cliente
            }
        });

        if (ventas.length <= 0) {

            response.status(204).json({
                status: 204,
                message: "No se encontraron ventas para el cliente con id " + id_cliente
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

module.exports = {
    getVentasFecha,
    getVentaById,
    createVenta,
    getVentasByCliente
    
};
