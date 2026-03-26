const { Compra, DetalleCompra, Inventario, Producto, Proveedor } = require("../models");

let getCompras = async (request, response) => {
    try {
        let compras = await Compra.findAll({
            include: [
                { model: Proveedor },
                {
                    model: DetalleCompra,
                    include: [
                        {
                            model: Inventario,
                            include: [{ model: Producto }]
                        }
                    ]
                }
            ]
        });
        response.status(200).json({ status: 200, data: compras });
    } catch (error) {
        response.status(500).json({ status: 500, message: error.message });
    }
};

let getCompraById = async (request, response) => {
    try {
        let compra = await Compra.findByPk(request.params.id, {
            include: [
                { model: Proveedor },
                {
                    model: DetalleCompra,
                    include: [
                        {
                            model: Inventario,
                            include: [{ model: Producto }]
                        }
                    ]
                }
            ]
        });

        if (!compra) {
            return response.status(404).json({ status: 404, message: "Compra no encontrada" });
        }

        response.status(200).json({ status: 200, data: compra });
    } catch (error) {
        response.status(500).json({ status: 500, message: error.message });
    }
};

let getResumen = async (request, response) => {
    try {
        const total     = await Compra.count();
        const sumaTotal = await Compra.sum("total");

        response.status(200).json({
            status: 200,
            data: {
                total_compras: total,
                suma_total:    sumaTotal ?? 0
            }
        });
    } catch (error) {
        response.status(500).json({ status: 500, message: error.message });
    }
};

let getComprasByFecha = async (request, response) => {
    try {
        const { fecha } = request.query;

        if (!fecha) {
            return response.status(400).json({ status: 400, message: "Debe enviar una fecha" });
        }

        let compras = await Compra.findAll({ where: { fecha } });

        if (compras.length === 0) {
            return response.status(204).json({ status: 204, message: "No se encontraron compras para esa fecha" });
        }

        response.status(200).json({ status: 200, data: compras });
    } catch (error) {
        response.status(500).json({ status: 500, message: error.message });
    }
};

let createCompra = async (request, response) => {
    try {
        const { proveedor_id, fecha, total, metodo_pago, id_usuario, detalles } = request.body;

        if (!proveedor_id || !fecha || !total) {
            return response.status(400).json({
                status: 400,
                message: "Proveedor, fecha y total son obligatorios"
            });
        }

        // Crear la compra
        let compra = await Compra.create({ proveedor_id, fecha, total, metodo_pago, id_usuario });

        // Crear los detalles si vienen en el body
        if (detalles && detalles.length > 0) {
            const filas = detalles.map((d) => ({
                id_compra: compra.id,
                id_lote:   d.id_lote,
                cantidad:  d.cantidad,
                subtotal:  d.subtotal
            }));
            await DetalleCompra.bulkCreate(filas);
        }

        response.status(201).json({
            status: 201,
            message: "Compra registrada correctamente",
            data: compra
        });
    } catch (error) {
        response.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = {
    getResumen,
    getComprasByFecha,
    getCompraById,
    getCompras,
    createCompra,
};
