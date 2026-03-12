const { Inventario, Producto } = require('../models');

let createInventario = async (request, response) => {
	try {
		const {
			id_prod,
			cantidad,
			cantidad_inicial,
			fecha_compra,
			fecha_vencimiento,
			lote_activo
		} = request.body;

		if (
			id_prod === undefined || cantidad === undefined || cantidad_inicial === undefined || !fecha_compra ||
			!fecha_vencimiento
		) {
			return response.status(400).json({
				status: 400,
				message: 'Faltan campos obligatorios de inventario'
			});
		}

		const producto = await Producto.findByPk(id_prod);
		if (!producto) {
			return response.status(404).json({
				status: 404,
				message: 'Producto no encontrado para el inventario'
			});
		}

		let inventario = await Inventario.create({
			id_prod,
			cantidad,
			cantidad_inicial,
			fecha_compra,
			fecha_vencimiento,
			lote_activo: lote_activo !== undefined ? lote_activo : true
		});

		response.status(201).json({
			status: 201,
			message: 'Inventario creado exitosamente',
			data: inventario
		});
	} catch (error) {
		response.status(500).json({
			status: 500,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
};

module.exports = {
	createInventario
};
