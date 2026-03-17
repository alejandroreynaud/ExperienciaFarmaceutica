//archivo para hacer endpoints de productos

const { Producto } = require('../models');

// Nuevo producto
let createProducto = async (request, response) => {
    try {
        const { nombre, codigo } = request.body;

        if (nombre === undefined || nombre === "" || codigo === undefined || codigo === "") {
            return response.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        let productoExistente = await Producto.findOne({ where: { nombre } });
        if (productoExistente) {
            return response.status(409).json({ error: 'El producto ya existe' });
        }

        let codigoExistente = await Producto.findOne({ where: { codigo } });
        if (codigoExistente) {
            return response.status(409).json({ error: 'El codigo del producto ya existe' });
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

//get

let getProductos = async (request, response) => {
    try { 
        let productos = await Producto.findAll();
        if (productos.length === 0) {
            return response.status(204).json({ 
                message: 'No se encontraron productos',
                status: 204
            });
        }
        response.status(200).json({ 
            message: 'Productos obtenidos exitosamente',
            status: 200,
            data: productos
        });
    }
    catch (error) {
        console.error('Error al obtener productos:', error);
        response.status(500).json({
            message: 'Error interno del servidor',
            status: 500,
            error: error.message
        });
    }
}

let getProductoByName = async (request, response) => {
    try {
        const { nombre } = request.params;
        if (nombre === undefined || nombre === "") {
            return response.status(400).json({ 
                message: 'Faltan campos obligatorios',
                status: 400
            });
        }
        let producto = await Producto.findOne({ where: { nombre } });

        if (!producto) {
            return response.status(404).json({
                message: 'Producto no encontrado',
                status: 404
            });
        }
        response.status(200).json({
            message: 'Producto obtenido exitosamente',
            status: 200,
            data: producto
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        response.status(500).json({
            message: 'Error interno del servidor',
            status: 500,
            error: error.message
        });
    }
};

// Actualizar producto
let updateProducto = async (request, response) => {
    try {
        const { id } = request.params;
        const { nombre, imagen, codigo } = request.body;

        if (!id) {
            return response.status(400).json({
                message: 'ID del producto es requerido',
                status: 400
            });
        }

        let producto = await Producto.findByPk(id);
        if (!producto) {
            return response.status(404).json({
                message: 'Producto no encontrado',
                status: 404
            });
        }

        if ((codigo !== undefined && codigo === "") || producto.codigo === null) {
            return response.status(400).json({
                message: 'El codigo del producto es obligatorio',
                status: 400
            });
        }

        if (nombre !== undefined && nombre !== "") {
            let productoExistente = await Producto.findOne({
                where: { nombre },
                attribute: ['id']
            });
            if (productoExistente && productoExistente.id !== parseInt(id)) {
                return response.status(409).json({
                    message: 'El nombre del producto ya existe',
                    status: 409
                });
            }
            producto.nombre = nombre;
        }

        if (imagen !== undefined && imagen !== "") {
            producto.imagen = imagen;
        }

        if (codigo !== undefined && codigo !== "") {
            let codigoExistente = await Producto.findOne({
                where: { codigo },
                attributes: ['id']
            });
            if (codigoExistente && codigoExistente.id !== parseInt(id)) {
                return response.status(409).json({
                    message: 'El codigo del producto ya existe',
                    status: 409
                });
            }
            producto.codigo = codigo;
        }

        await producto.save();
        response.status(200).json({
            message: 'Producto actualizado exitosamente',
            status: 200,
            data: producto
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        response.status(500).json({
            message: 'Error interno del servidor',
            status: 500,
            error: error.message
        });
    }
};

module.exports = {
    createProducto,
    getProductos,
    getProductoByName,
    updateProducto
}