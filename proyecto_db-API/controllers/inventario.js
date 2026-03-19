const { Op } = require("sequelize");
const { Inventario, Producto } = require("../models");
const db = require("../config/config");

exports.getTotalInventario = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(cantidad), 0) AS total_unidades
      FROM inventario
      WHERE lote_activo = true
    `;

    const [rows] = await db.query(query);

    res.json({
      total: parseInt(rows[0].total_unidades)
    });

  } catch (error) {
    console.error("Error en total inventario:", error);
    res.status(500).json({
      message: "Error obteniendo total de inventario"
    });
  }
};

exports.getProximosVencer = async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id_lote,
        p.nombre AS producto,
        i.cantidad,
        i.fecha_vencimiento,
        DATEDIFF(i.fecha_vencimiento, CURDATE()) AS dias_restantes
      FROM inventario i
      JOIN productos p ON i.id_prod = p.id_prod
      WHERE i.lote_activo = true
        AND i.cantidad > 0
        AND i.fecha_vencimiento IS NOT NULL
        AND DATEDIFF(i.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 30
      ORDER BY dias_restantes ASC
    `;

    const [rows] = await db.query(query);

    const resultado = rows.map(row => ({
      id_lote: row.id_lote,
      producto: row.producto,
      cantidad: row.cantidad,
      fecha_vencimiento: row.fecha_vencimiento,
      dias_restantes: row.dias_restantes
    }));

    res.json(resultado);

  } catch (error) {
    console.error("Error en proximos a vencer:", error);
    res.status(500).json({
      message: "Error obteniendo productos próximos a vencer"
    });
  }
};

exports.getBajoStock = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_prod,
        p.nombre,
        SUM(i.cantidad) AS stock_actual,
        SUM(i.cantidad_inicial) AS stock_inicial,
        (SUM(i.cantidad) / SUM(i.cantidad_inicial)) * 100 AS porcentaje
      FROM inventario i
      JOIN productos p ON i.id_prod = p.id_prod
      WHERE i.lote_activo = true
      GROUP BY p.id_prod, p.nombre
      HAVING porcentaje <= 30
    `;

    const [rows] = await db.query(query);

    const resultado = rows.map(row => ({
      id_prod: row.id_prod,
      nombre: row.nombre,
      stock_actual: parseInt(row.stock_actual),
      stock_inicial: parseInt(row.stock_inicial),
      porcentaje: parseFloat(row.porcentaje).toFixed(2)
    }));

    res.json(resultado);

  } catch (error) {
    console.error("Error en bajo stock:", error);
    res.status(500).json({
      message: "Error obteniendo productos con bajo stock"
    });
  }
};

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

module.exports = {
  createInventario,
  getInventarios,
  getInventarioByCodigo,
};
