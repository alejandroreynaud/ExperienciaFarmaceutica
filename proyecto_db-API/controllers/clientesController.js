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

        // Respuesta exitosa
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

module.exports = {
    getClienteById
};