const { Op } = require("sequelize");
const { Inventario, Producto } = require("../models");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

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
      precio_costo,
      precio_venta,
    } = request.body;

    if (!codigo && !nombre) {
      return response.status(400).json({
        status: 400,
        message: "Debe proporcionar el nombre o código del producto",
      });
    }

    if (
      cantidad === undefined ||
      cantidad === "" ||
      !fecha_compra ||
      !fecha_vencimiento ||
      fecha_compra === "" ||
      fecha_vencimiento === "" ||
      precio_costo === undefined ||
      precio_costo === "" ||
      precio_venta === undefined ||
      precio_venta === ""
    ) {
      return response.status(400).json({
        status: 400,
        message:
          "Faltan campos obligatorios: cantidad, fecha_compra, fecha_vencimiento, precio_costo, precio_venta",
      });
    }

    const whereClause = codigo
      ? { codigo: cleanString(codigo) }
      : { nombre: cleanString(nombre) };

    if (!Object.values(whereClause)[0]) {
      return response.status(400).json({
        status: 400,
        message: "El codigo o nombre enviado no es válido",
      });
    }

    const producto = await Producto.findOne({ where: whereClause });

    if (!producto) {
      return response.status(404).json({
        status: 404,
        message: "Producto no encontrado para el nombre o código enviado",
      });
    }

    if (!producto.activo) {
      return response.status(409).json({
        status: 409,
        message: "No se puede agregar inventario a un producto inactivo",
      });
    }

    const cantidadActual = Number(cantidad);
    const costo = Number(precio_costo);
    const venta = Number(precio_venta);
    const fechaCompra = normalizeDate(fecha_compra);
    const fechaVencimiento = normalizeDate(fecha_vencimiento);

    if (!Number.isInteger(cantidadActual) || cantidadActual <= 0) {
      return response.status(400).json({
        status: 400,
        message: "La cantidad debe ser un numero entero positivo",
      });
    }

    if (isNaN(costo) || costo < 0) {
      return response.status(400).json({
        status: 400,
        message: "El precio_costo debe ser un número no negativo",
      });
    }

    if (isNaN(venta) || venta <= 0) {
      return response.status(400).json({
        status: 400,
        message: "El precio_venta debe ser un número positivo",
      });
    }

    if (venta < costo) {
      return response.status(400).json({
        status: 400,
        message: "El precio_venta no puede ser menor al precio_costo",
      });
    }

    if (
      request.body.cantidad_inicial !== undefined &&
      request.body.cantidad_inicial !== "" &&
      Number(request.body.cantidad_inicial) !== cantidadActual
    ) {
      return response.status(400).json({
        status: 400,
        message:
          "La cantidad inicial no debe enviarse manualmente con un valor distinto a la cantidad actual",
      });
    }

    if (!fechaCompra || !fechaVencimiento) {
      return response.status(400).json({
        status: 400,
        message:
          "La fecha de compra y fecha de vencimiento deben ser fechas válidas",
      });
    }

    if (fechaVencimiento <= fechaCompra) {
      return response.status(400).json({
        status: 400,
        message:
          "La fecha de vencimiento debe ser posterior a la fecha de compra",
      });
    }

    let inventario = await Inventario.create({
      id_prod: producto.id,
      cantidad: cantidadActual,
      cantidad_inicial: cantidadActual,
      fecha_compra: fechaCompra,
      fecha_vencimiento: fechaVencimiento,
      lote_activo: lote_activo !== undefined ? lote_activo : true,
      precio_costo: costo,
      precio_venta: venta,
    });

    response.status(201).json({
      status: 201,
      message: "Inventario creado exitosamente",
      data: inventario.toJSON(),
      producto: {
        codigo: producto.codigo,
        nombre: producto.nombre,
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

    if (codigoProducto) whereProducto.codigo = codigoProducto;
    if (nombreProducto)
      whereProducto.nombre = { [Op.iLike]: `%${nombreProducto}%` };

    let inventarios = await Inventario.findAll({
      include: [
        {
          model: Producto,
          attributes: ["codigo", "nombre", "imagen"],
          where: whereProducto,
          required: Object.keys(whereProducto).length > 0,
        },
      ],
      order: [["fecha_vencimiento", "ASC"]],
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
      include: [
        { model: Producto, attributes: ["codigo", "nombre", "imagen"] },
      ],
      order: [
        ["fecha_vencimiento", "ASC"],
        ["createdAt", "ASC"],
      ],
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
    const {
      cantidad,
      fecha_vencimiento,
      lote_activo,
      precio_costo,
      precio_venta,
    } = request.body;

    if (!id) {
      return response.status(400).json({
        status: 400,
        message: "ID del lote de inventario es requerido",
      });
    }

    if (
      cantidad === undefined &&
      fecha_vencimiento === undefined &&
      lote_activo === undefined &&
      precio_costo === undefined &&
      precio_venta === undefined
    ) {
      return response.status(400).json({
        status: 400,
        message: "Debe enviar al menos un campo para actualizar",
      });
    }

    let inventario = await Inventario.findByPk(id, {
      include: [
        { model: Producto, attributes: ["nombre", "codigo", "activo"] },
      ],
    });

    if (!inventario) {
      return response.status(404).json({
        status: 404,
        message: "Lote de inventario no encontrado",
      });
    }

    if (!inventario.lote_activo && lote_activo !== true) {
      return response.status(409).json({
        status: 409,
        message:
          "No se puede modificar un lote inactivo. Si desea reabrirlo, envíe lote_activo: true",
      });
    }

    if (cantidad !== undefined) {
      const nuevaCantidad = Number(cantidad);

      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
        return response.status(400).json({
          status: 400,
          message: "La cantidad debe ser un número entero no negativo",
        });
      }

      if (nuevaCantidad > inventario.cantidad_inicial) {
        return response.status(400).json({
          status: 400,
          message: `La cantidad no puede superar la cantidad inicial del lote (${inventario.cantidad_inicial})`,
        });
      }

      inventario.cantidad = nuevaCantidad;

      if (nuevaCantidad === 0) inventario.lote_activo = false;
    }

    if (fecha_vencimiento !== undefined) {
      const nuevaFecha = normalizeDate(fecha_vencimiento);

      if (!nuevaFecha) {
        return response.status(400).json({
          status: 400,
          message: "La fecha de vencimiento no es válida",
        });
      }

      if (nuevaFecha.getTime() <= new Date(inventario.fecha_compra).getTime()) {
        return response.status(400).json({
          status: 400,
          message:
            "La fecha de vencimiento debe ser posterior a la fecha de compra",
        });
      }

      inventario.fecha_vencimiento = nuevaFecha;
    }

    if (lote_activo !== undefined) {
      if (typeof lote_activo !== "boolean") {
        return response.status(400).json({
          status: 400,
          message: "El campo lote_activo debe ser un booleano",
        });
      }
      inventario.lote_activo = lote_activo;
    }

    if (precio_costo !== undefined) {
      const nuevoCosto = Number(precio_costo);
      if (isNaN(nuevoCosto) || nuevoCosto < 0) {
        return response.status(400).json({
          status: 400,
          message: "El precio_costo debe ser un número no negativo",
        });
      }
      inventario.precio_costo = nuevoCosto;
    }

    if (precio_venta !== undefined) {
      const nuevoPrecioVenta = Number(precio_venta);
      if (isNaN(nuevoPrecioVenta) || nuevoPrecioVenta <= 0) {
        return response.status(400).json({
          status: 400,
          message: "El precio_venta debe ser un número positivo",
        });
      }
      // Validar contra el costo actual (usando el nuevo si también viene)
      const costoFinal =
        precio_costo !== undefined
          ? Number(precio_costo)
          : parseFloat(inventario.precio_costo);
      if (nuevoPrecioVenta < costoFinal) {
        return response.status(400).json({
          status: 400,
          message: "El precio_venta no puede ser menor al precio_costo",
        });
      }
      inventario.precio_venta = nuevoPrecioVenta;
    }

    await inventario.save();

    response.status(200).json({
      status: 200,
      message: "Lote de inventario actualizado exitosamente",
      data: inventario,
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let getAlertasPorVencer = async (request, response) => {
  try {
    const diasRaw =
      request.query.dias !== undefined ? Number(request.query.dias) : 30;

    if (!Number.isInteger(diasRaw) || diasRaw < 0) {
      return response.status(400).json({
        status: 400,
        message: "El parámetro dias debe ser un número entero no negativo",
      });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + diasRaw);

    const lotes = await Inventario.findAll({
      where: {
        lote_activo: true,
        fecha_vencimiento: { [Op.lte]: fechaLimite },
      },
      include: [
        {
          model: Producto,
          attributes: ["codigo", "nombre", "imagen"],
          where: { activo: true },
        },
      ],
      order: [["fecha_vencimiento", "ASC"]],
    });

    if (!lotes.length) {
      return response.status(200).json({
        status: 200,
        message: `No hay lotes activos que venzan en los próximos ${diasRaw} días`,
        data: [],
      });
    }

    const data = lotes.map((lote) => {
      const fechaVenc = new Date(lote.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diasParaVencer = Math.round(
        (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        id_lote: lote.id,
        codigo: lote.Producto.codigo,
        nombre: lote.Producto.nombre,
        imagen: lote.Producto.imagen,
        cantidad: lote.cantidad,
        precio_venta: lote.precio_venta,
        fecha_vencimiento: lote.fecha_vencimiento,
        dias_para_vencer: diasParaVencer,
        vencido: diasParaVencer < 0,
      };
    });

    response.status(200).json({
      status: 200,
      message: `Se encontraron ${data.length} lote(s) que vencen en los próximos ${diasRaw} días`,
      data,
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let getReporteStockTotal = async (request, response) => {
  try {
    const { codigo, nombre } = request.query;
    const whereProducto = {};

    const codigoProducto = cleanString(codigo);
    const nombreProducto = cleanString(nombre);

    if (codigo !== undefined && !codigoProducto) {
      return response.status(400).json({
        status: 400,
        message: "Debe ingresar un codigo válido para el producto",
      });
    }

    if (nombre !== undefined && !nombreProducto) {
      return response.status(400).json({
        status: 400,
        message: "El nombre no puede ser vacío",
      });
    }

    if (codigoProducto) whereProducto.codigo = codigoProducto;
    if (nombreProducto)
      whereProducto.nombre = { [Op.iLike]: `%${nombreProducto}%` };

    const productos = await Producto.findAll({
      where: whereProducto,
      attributes: ["id", "codigo", "nombre", "imagen", "activo"],
      include: [
        {
          model: Inventario,
          attributes: ["cantidad", "lote_activo", "precio_venta"],
          required: false,
        },
      ],
      order: [["nombre", "ASC"]],
    });

    if (!productos.length) {
      return response.status(404).json({
        status: 404,
        message: "No se encontraron productos para los filtros enviados",
      });
    }

    const reporte = productos.map((prod) => {
      const todosLosLotes = prod.Inventarios || [];
      const lotesActivos = todosLosLotes.filter((l) => l.lote_activo);
      const stockTotal = lotesActivos.reduce(
        (sum, lote) => sum + lote.cantidad,
        0,
      );

      const precioVentaActual = lotesActivos.length
        ? Math.min(...lotesActivos.map((l) => parseFloat(l.precio_venta)))
        : null;

      return {
        codigo: prod.codigo,
        nombre: prod.nombre,
        imagen: prod.imagen,
        activo: prod.activo,
        stock_total: stockTotal,
        precio_venta_actual: precioVentaActual,
        lotes_activos: lotesActivos.length,
        lotes_totales: todosLosLotes.length,
      };
    });

    response.status(200).json({
      status: 200,
      message: "Reporte de stock total obtenido exitosamente",
      total_productos: reporte.length,
      data: reporte,
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  createInventario,
  getInventarios,
  getInventarioByCodigo,
  updateInventario,
  //getAlertasBajoStock,
  getAlertasPorVencer,
  getReporteStockTotal,
};
