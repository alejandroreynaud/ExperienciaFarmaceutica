const { Cliente } = require("../models");

let getClienteById = async (request, response) => {
    try {

        const id = request.params.id;
        let cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return response.status(404).json({
                status: 404,
                message: "Cliente no encontrado"
            });
        }

        response.status(200).json({
            status: 200,
            data: cliente
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};


let createCliente = async (request, response) => {
    try {

        // Recibir datos del body
        const { nombre, identidad, RTN, telefono } = request.body;

        // Validar datos
        if (!nombre || !telefono || !identidad) {
            return response.status(400).json({
                status: 400,
                message: "Nombre, identidad y teléfono son obligatorios"
            });
        }

        // Crear cliente
        let cliente = await Cliente.create({
            nombre,
            identidad,
            RTN,
            telefono
        });

        response.status(201).json({
            status: 201,
            message: "Cliente creado correctamente",
            data: cliente
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

module.exports = {
    getClienteById,
    createCliente
};