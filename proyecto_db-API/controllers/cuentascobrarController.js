const { CuentaCobrar, Cliente } = require("../models");

let getCuentaCobrarById = async (request, response) => {
    try {

        const id = request.params.id;

        let cuenta = await CuentaCobrar.findByPk(id, {
            include: [
                {
                    model: Cliente,
                    as: "cliente",
                    attributes: ["id", "nombre", "identidad", "RTN", "telefono"]
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



module.exports = {
    getCuentaCobrarById,
    createCuentaCobrar,
    updateCuentaCobrar
};