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

let getInventarios = async (request, response) => {
	try {
		let inventarios = await Inventario.findAll({
			include: [{ model: Producto, attributes: ['nombre', 'imagen'] }]
		});

		if (inventarios.length === 0) {
			return response.status(204).json({
				status: 204,
				message: 'No se encontraron registros de inventario'
			});
		}

		response.status(200).json({
			status: 200,
			message: 'Inventario obtenido exitosamente',
			data: inventarios
		});
	} catch (error) {
		response.status(500).json({
			status: 500,
			message: 'Error interno del servidor',
			error: error.message
		});
	}
};

let getInventarioById = async (request, response) => {
	try {
		const { id } = request.params;

		let inventario = await Inventario.findByPk(id, {
			include: [{ model: Producto, attributes: ['nombre', 'imagen'] }]
		});

		if (!inventario) {
			return response.status(404).json({
				status: 404,
				message: 'Registro de inventario no encontrado'
			});
		}

		response.status(200).json({
			status: 200,
			message: 'Inventario obtenido exitosamente',
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
	createInventario,
	getInventarios,
	getInventarioById
};
