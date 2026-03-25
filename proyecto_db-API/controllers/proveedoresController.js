const { Proveedor } = require("../models");

const cleanString = (value) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length ? text : null;
};

let getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [["nombre", "ASC"]] });

    return res.status(200).json({
      status: 200,
      message: "Proveedores obtenidos exitosamente",
      data: proveedores,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let createProveedor = async (req, res) => {
  try {
    const nombre = cleanString(req.body?.nombre);
    const telefono = cleanString(req.body?.telefono);

    if (!nombre || !telefono) {
      return res.status(400).json({
        status: 400,
        message: "Los campos nombre y telefono son obligatorios",
      });
    }

    const existente = await Proveedor.findOne({ where: { nombre } });
    if (existente) {
      return res.status(409).json({
        status: 409,
        message: "El proveedor ya existe",
      });
    }

    const proveedor = await Proveedor.create({ nombre, telefono });

    return res.status(201).json({
      status: 201,
      message: "Proveedor creado exitosamente",
      data: proveedor,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({
        status: 404,
        message: "Proveedor no encontrado",
      });
    }

    await proveedor.destroy();

    return res.status(200).json({
      status: 200,
      message: "Proveedor eliminado exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  deleteProveedor,
};
