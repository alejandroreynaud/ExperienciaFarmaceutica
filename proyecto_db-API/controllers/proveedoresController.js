const { Proveedor } = require("../models");

let getProveedores = async (request, response) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [["nombre", "ASC"]] });
    response.status(200).json({ status: 200, data: proveedores });
  } catch (error) {
    response.status(500).json({ status: 500, message: error.message });
  }
};

let getProveedorById = async (request, response) => {
  try {
    const proveedor = await Proveedor.findByPk(request.params.id);

    if (!proveedor) {
      return response.status(404).json({ status: 404, message: "Proveedor no encontrado" });
    }

    response.status(200).json({ status: 200, data: proveedor });
  } catch (error) {
    response.status(500).json({ status: 500, message: error.message });
  }
};

let createProveedor = async (request, response) => {
  try {
    const { nombre, telefono } = request.body;

    if (!nombre) {
      return response.status(400).json({ status: 400, message: "El nombre del proveedor es obligatorio" });
    }

    const proveedor = await Proveedor.create({ nombre, telefono });
    response.status(201).json({ status: 201, message: "Proveedor creado correctamente", data: proveedor });
  } catch (error) {
    response.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  getProveedores,
  getProveedorById,
  createProveedor,
};