const { Op } = require("sequelize");
const { Inventario, Producto } = require("../models");

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

// Función para limpiar y validar cadenas de texto
const cleanString = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim();
  return text.length > 0 ? text : null;
};

let createInventario = async (request, response) => {
  try {
    const {
      codigo,
	  nombre,
      cantidad,
      fecha_compra,
      fecha_vencimiento,
      lote_activo,
    } = request.body;

	 if (!nombre_prod && !codigo_prod) {
            return response.status(400).json({
                status: 400,
                message: 'Debe proporcionar el nombre o código del producto'
            });
        }

    if (
      codigo === undefined ||
	  nombre === undefined ||
      cantidad === undefined ||
      !fecha_compra ||
      !fecha_vencimiento ||
      codigo === "" ||
	  nombre === "" ||
      cantidad === "" ||
      fecha_compra === "" ||
      fecha_vencimiento === ""
    ) {
      return response.status(400).json({
        status: 400,
        message: "Faltan campos obligatorios de inventario",
      });
    }

    const codigoProducto = cleanString(codigo);
    if (!codigoProducto) {
      return response.status(400).json({
        status: 400,
        message: "Debe ingresar un codigo valido para el producto",
      });
    }

    const whereClause = codigo_prod
            ? { codigo: codigo}
            : { nombre: nombre};

        const producto = await Producto.findOne({ where: whereClause });

        if (!producto) {
            return response.status(404).json({
                status: 404,
                message: 'Producto no encontrado para el nombre o código enviado'
            });
        }

    const cantidadActual = Number(cantidad);
    const fechaCompra = normalizeDate(fecha_compra);
    const fechaVencimiento = normalizeDate(fecha_vencimiento);

    if (!Number.isInteger(cantidadActual) || cantidadActual <= 0) {
      return response.status(400).json({
        status: 400,
        message: "La cantidad debe ser un numero entero positivo",
      });
    }

    if (
      request.body.cantidad_inicial !== undefined &&
      request.body.cantidad_inicial !== "" &&
      Number(request.body.cantidad_inicial) !== cantidadActual
    ) {
      return response.status(400).json({
        status: 400,
        message: "La cantidad inicial no debe enviarse manualmente con un valor distinto a la cantidad actual",
      });
    }

    const cantidadInicial = cantidadActual;

    if (!fechaCompra || !fechaVencimiento) {
      return response.status(400).json({
        status: 400,
        message: "La fecha de compra y fecha de vencimiento deben ser fechas válidas",
      });
    }

    if (new Date(fechaVencimiento) <= new Date(fechaCompra)) {
      return response.status(400).json({
        status: 400,
        message: "La fecha de vencimiento debe ser posterior a la fecha de compra",
    });
    }

    let inventario = await Inventario.create({
      id_prod: producto.id,
      cantidad: cantidadActual,
      cantidad_inicial: cantidadInicial,
      fecha_compra: fechaCompra,
      fecha_vencimiento: fechaVencimiento,
      lote_activo: lote_activo !== undefined ? lote_activo : true,
    });

    response.status(201).json({
      status: 201,
      message: "Inventario creado exitosamente",
      data: inventario.json(),
		producto: {
			codigo: producto.codigo,
			nombre: producto.nombre
		}
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let getInventarios = async (request, response) => {
  try {
    const { codigo, nombre } = request.query;
    const whereProducto = {};

    const codigoProducto = cleanString(codigo);
    const nombreProducto = cleanString(nombre);

    if (codigo !== undefined && !codigoProducto) {
      return response.status(400).json({
        status: 400,
        message: "Debe ingresar un codigo valido para el producto",
      });
    }

    if (nombre !== undefined && !nombreProducto) {
      return response.status(400).json({
        status: 400,
        message: "El nombre no puede ser vacio",
      });
    }

    if (codigoProducto) {
      whereProducto.codigo = codigoProducto;
    }

    if (nombreProducto) {
      whereProducto.nombre = { [Op.iLike]: `%${nombreProducto}%` };
    }

    let inventarios = await Inventario.findAll({
      include: [
        {
          model: Producto,
          attributes: ["codigo", "nombre", "imagen"],
          where: whereProducto,
          required: Object.keys(whereProducto).length > 0,
        },
      ],
    });

    if (!inventarios.length) {
      return response.status(404).json({
        status: 404,
        message: "No hay registros de inventario para los filtros enviados",
      });
    }

    response.status(200).json({
      status: 200,
      message: "Inventario obtenido exitosamente",
      data: inventarios,
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let getInventarioByCodigo = async (request, response) => {
  try {
    const codigoProducto = cleanString(request.params.codigo);

    if (!codigoProducto) {
      return response.status(400).json({
        status: 400,
        message: "Debe ingresar un codigo válido para el producto",
      });
    }

    const producto = await Producto.findOne({
      where: { codigo: codigoProducto },
      attributes: ["id", "codigo", "nombre", "imagen"],
    });

    if (!producto) {
      return response.status(404).json({
        status: 404,
        message: "Producto no encontrado para el codigo enviado",
      });
    }

    let inventarios = await Inventario.findAll({
      where: { id_prod: producto.id },
      include: [{ model: Producto, attributes: ["codigo", "nombre", "imagen"] }],
      order: [["fecha_vencimiento", "ASC"], ["createdAt", "ASC"]],
    });

    if (!inventarios.length) {
      return response.status(404).json({
        status: 404,
        message: "No hay registros de inventario para el codigo enviado",
      });
    }

    response.status(200).json({
      status: 200,
      message: "Inventario obtenido exitosamente",
      data: {
        producto,
        lotes: inventarios,
      },
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let updateInventario = async (request, response) => {
    try {
        const { id } = request.params;
        const { cantidad, fecha_vencimiento, lote_activo } = request.body;

        if (!id) {
            return response.status(400).json({
                status: 400,
                message: 'ID del lote de inventario es requerido'
            });
        }

        // Verificar que no venga el body completamente vacío
        if (cantidad === undefined && fecha_vencimiento === undefined && lote_activo === undefined) {
            return response.status(400).json({
                status: 400,
                message: 'Debe enviar al menos un campo para actualizar'
            });
        }

        let inventario = await Inventario.findByPk(id, {
            include: [{ 
                model: Producto, 
                attributes: ['nombre', 'codigo', 'activo'] 
            }]
        });

        if (!inventario) {
            return response.status(404).json({
                status: 404,
                message: 'Lote de inventario no encontrado'
            });
        }

        // No permitir tocar un lote cerrado
        if (!inventario.lote_activo && lote_activo !== true) {
            return response.status(409).json({
                status: 409,
                message: 'No se puede modificar un lote inactivo. Si desea reabrirlo, envíe lote_activo: true'
            });
        }

        // --- Actualizar cantidad ---
        if (cantidad !== undefined) {
            const nuevaCantidad = Number(cantidad);

            if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
                return response.status(400).json({
                    status: 400,
                    message: 'La cantidad debe ser un número entero no negativo'
                });
            }

            // Si la corrección supera la cantidad inicial, es un error de negocio
            if (nuevaCantidad > inventario.cantidad_inicial) {
                return response.status(400).json({
                    status: 400,
                    message: `La cantidad no puede superar la cantidad inicial del lote (${inventario.cantidad_inicial})`
                });
            }

            inventario.cantidad = nuevaCantidad;

            // Cierre automático si el lote llega a 0
            if (nuevaCantidad === 0) {
                inventario.lote_activo = false;
            }
        }

        // --- Actualizar fecha de vencimiento ---
        if (fecha_vencimiento !== undefined) {
            const nuevaFecha = normalizeDate(fecha_vencimiento);

            if (!nuevaFecha) {
                return response.status(400).json({
                    status: 400,
                    message: 'La fecha de vencimiento no es válida'
                });
            }

            if (nuevaFecha.getTime() <= new Date(inventario.fecha_compra).getTime()) {
                return response.status(400).json({
                    status: 400,
                    message: 'La fecha de vencimiento debe ser posterior a la fecha de compra'
                });
            }

            inventario.fecha_vencimiento = nuevaFecha;
        }

        if (lote_activo !== undefined) {
            if (typeof lote_activo !== 'boolean') {
                return response.status(400).json({
                    status: 400
                    // log: 'El campo lote_activo debe ser un booleano'
                });
            }
            inventario.lote_activo = lote_activo;
        }

        await inventario.save();

        response.status(200).json({
            status: 200,
            message: 'Lote de inventario actualizado exitosamente',
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
  getInventarioByCodigo,
  updateInventario,

};
