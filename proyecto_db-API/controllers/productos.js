//archivo para hacer endpoints de productos

const { Producto } = require('../models');

// Nuevo producto
let createProducto = async (request, response) => {
    try {
        const { nombre } = request.body;

        if (nombre === undefined || nombre === "") {
            return response.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        let productoExistente = await Producto.findOne({ where: { nombre } });
        if (productoExistente) {
            return response.status(409).json({ error: 'El producto ya existe' });
        }

        let nuevoProducto = await Producto.create(request.body);
        response.status(201).json({ 
            message: 'Producto creado exitosamente',
            status: 201,
            data: nuevoProducto
         });

    } catch (error) {
        console.error('Error al crear producto:', error);
        response.status(500).json({ 
            message: 'Error interno del servidor',
            status: 500,
            error: error.message});
    }   
}

module.exports = {
    createProducto
}