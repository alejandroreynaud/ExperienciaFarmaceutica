const { Op } = require("sequelize");
const { Inventario, Producto, Proveedor, LoteProveedor } = require("../models");
const PDFDocument = require("pdfkit");

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

const formatDateOnly = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
};

const createSimplePdfDocument = (response, filename, title) => {
  const now = new Date();
  const generatedAtHn = now.toLocaleString("es-HN", {
    timeZone: "America/Tegucigalpa",
    hour12: true,
  });

  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(response);

  const contentWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const drawHeader = () => {
    const x = doc.page.margins.left;
    const y = doc.page.margins.top;
    doc.rect(x, y, contentWidth, 54).fill("#F3F4F6");
    doc.fillColor("#111827").fontSize(16).text(title, x + 12, y + 10);
    doc
      .fillColor("#4B5563")
      .fontSize(9)
      .text(`Generado: ${generatedAtHn} | Generado por: Admin`, x + 12, y + 31);
    doc.fillColor("#000");
    doc.y = y + 66;
  };

  doc.on("pageAdded", drawHeader);
  drawHeader();

  return doc;
};

const parseBooleanFilter = (value, fieldName) => {
  const text = cleanString(value);
  if (!text || text.toLowerCase() === "todos") return undefined;
  if (text.toLowerCase() === "activo" || text.toLowerCase() === "true") return true;
  if (text.toLowerCase() === "inactivo" || text.toLowerCase() === "false") return false;
  throw new Error(`El filtro ${fieldName} debe ser activo, inactivo o todos`);
};

const parseNumberFilter = (value, fieldName) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`El filtro ${fieldName} debe ser un número válido`);
  }
  return num;
};

const buildInventarioFilters = (query) => {
  const {
    codigo,
    nombre,
    estado_producto,
    estado_lote,
    id_prov,
    vence_desde,
    vence_hasta,
    stock_min,
    stock_max,
    precio_min,
    precio_max,
  } = query;

  const whereProducto = {};
  const whereInventario = {};
  const codigoProducto = cleanString(codigo);
  const nombreProducto = cleanString(nombre);

  if (codigo !== undefined && !codigoProducto) {
    throw new Error("Debe ingresar un codigo valido para el producto");
  }

  if (nombre !== undefined && !nombreProducto) {
    throw new Error("El nombre no puede ser vacio");
  }

  if (codigoProducto) whereProducto.codigo = codigoProducto;
  if (nombreProducto) whereProducto.nombre = { [Op.iLike]: `%${nombreProducto}%` };

  const estadoProducto = parseBooleanFilter(estado_producto, "estado_producto");
  if (estadoProducto !== undefined) whereProducto.activo = estadoProducto;

  const estadoLote = parseBooleanFilter(estado_lote, "estado_lote");
  if (estadoLote !== undefined) whereInventario.lote_activo = estadoLote;

  const fechaDesde = cleanString(vence_desde);
  const fechaHasta = cleanString(vence_hasta);
  if (fechaDesde || fechaHasta) {
    whereInventario.fecha_vencimiento = {};
    if (fechaDesde) {
      const desde = normalizeDate(fechaDesde);
      if (!desde) throw new Error("El filtro vence_desde no es una fecha válida");
      whereInventario.fecha_vencimiento[Op.gte] = desde;
    }
    if (fechaHasta) {
      const hasta = normalizeDate(fechaHasta);
      if (!hasta) throw new Error("El filtro vence_hasta no es una fecha válida");
      whereInventario.fecha_vencimiento[Op.lte] = hasta;
    }
  }

  const stockMin = parseNumberFilter(stock_min, "stock_min");
  const stockMax = parseNumberFilter(stock_max, "stock_max");
  if (stockMin !== undefined || stockMax !== undefined) {
    whereInventario.cantidad = {};
    if (stockMin !== undefined) whereInventario.cantidad[Op.gte] = stockMin;
    if (stockMax !== undefined) whereInventario.cantidad[Op.lte] = stockMax;
  }

  const priceMin = parseNumberFilter(precio_min, "precio_min");
  const priceMax = parseNumberFilter(precio_max, "precio_max");
  if (priceMin !== undefined || priceMax !== undefined) {
    whereInventario.precio_venta = {};
    if (priceMin !== undefined) whereInventario.precio_venta[Op.gte] = priceMin;
    if (priceMax !== undefined) whereInventario.precio_venta[Op.lte] = priceMax;
  }

  let proveedorId;
  if (id_prov !== undefined && cleanString(id_prov)) {
    proveedorId = Number(id_prov);
    if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
      throw new Error("El filtro id_prov debe ser un entero positivo");
    }
  }

  return { whereProducto, whereInventario, proveedorId };
};

let createInventario = async (request, response) => {
  try {
    const {
      codigo,
      nombre,
      id_prov,
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

    const proveedorId = Number(id_prov);
    if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
      return response.status(400).json({
        status: 400,
        message: "Debe proporcionar un proveedor válido (id_prov)",
      });
    }

    const proveedor = await Proveedor.findByPk(proveedorId);
    if (!proveedor) {
      return response.status(404).json({
        status: 404,
        message: "Proveedor no encontrado",
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

    const whereClause = codigo ? { codigo: codigo } : { nombre: nombre };

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

    await LoteProveedor.create({
      id_lote: inventario.id,
      id_prov: proveedor.id,
    });

    response.status(201).json({
      status: 201,
      message: "Inventario creado exitosamente",
      data: inventario.toJSON(),
      producto: {
        codigo: producto.codigo,
        nombre: producto.nombre,
      },
      proveedor: {
        id: proveedor.id,
        nombre: proveedor.nombre,
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
    const { whereProducto, whereInventario, proveedorId } = buildInventarioFilters(request.query);

    let inventarios = await Inventario.findAll({
      where: whereInventario,
      include: [
        {
          model: Producto,
          attributes: ["codigo", "nombre", "imagen", "activo"],
          where: whereProducto,
          required: Object.keys(whereProducto).length > 0,
        },
        {
          model: LoteProveedor,
          attributes: ["id_prov"],
          where: proveedorId ? { id_prov: proveedorId } : undefined,
          required: Boolean(proveedorId),
          include: [
            {
              model: Proveedor,
              attributes: ["id", "nombre", "telefono"],
            },
          ],
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
    if (error.message && error.message.startsWith("El filtro")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
    if (error.message && error.message.startsWith("Debe ingresar")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
    if (error.message && error.message.startsWith("El nombre")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
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

      if (nuevaCantidad === 0) {
        inventario.lote_activo = false;
      }
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

    // Traemos lotes activos que vencen en el rango [hoy - sin límite inferior, fechaLimite]
    // Incluimos los ya vencidos (fecha_vencimiento < hoy) para que el frontend los pueda marcar en rojo
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

    if (codigoProducto) {
      whereProducto.codigo = codigoProducto;
    }

    if (nombreProducto) {
      whereProducto.nombre = { [Op.iLike]: `%${nombreProducto}%` };
    }

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

let getAlertasBajoStock = async (request, response) => {
  try {
    const umbralRaw =
      request.query.umbral !== undefined ? Number(request.query.umbral) : 10;

    if (!Number.isInteger(umbralRaw) || umbralRaw < 0) {
      return response.status(400).json({
        status: 400,
        message: "El umbral debe ser un número entero no negativo",
      });
    }

    const productos = await Producto.findAll({
      where: { activo: true },
      attributes: ["id", "codigo", "nombre", "imagen"],
      include: [
        {
          model: Inventario,
          attributes: ["cantidad"],
          where: { lote_activo: true },
          required: false,
        },
      ],
    });

    const productosConBajoStock = productos
      .map((prod) => {
        const stockTotal = prod.Inventarios
          ? prod.Inventarios.reduce((sum, lote) => sum + lote.cantidad, 0)
          : 0;
        return {
          codigo: prod.codigo,
          nombre: prod.nombre,
          imagen: prod.imagen,
          stock_total: stockTotal,
          umbral: umbralRaw,
        };
      })
      .filter((prod) => prod.stock_total < umbralRaw)
      .sort((a, b) => a.stock_total - b.stock_total);

    if (!productosConBajoStock.length) {
      return response.status(200).json({
        status: 200,
        message: `No hay productos con stock por debajo de ${umbralRaw} unidades`,
        data: [],
      });
    }

    response.status(200).json({
      status: 200,
      message: `Se encontraron ${productosConBajoStock.length} producto(s) con stock por debajo de ${umbralRaw} unidades`,
      data: productosConBajoStock,
    });
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let exportExpiringPDF = async (request, response) => {
  try {
    const diasRaw =
      request.query.dias !== undefined ? Number(request.query.dias) : 30;

    if (!Number.isInteger(diasRaw) || diasRaw < 0) {
      return response.status(400).json({
        status: 400,
        message: "El parametro dias debe ser un numero entero no negativo",
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
          attributes: ["codigo", "nombre"],
          where: { activo: true },
        },
      ],
      order: [["fecha_vencimiento", "ASC"]],
    });

    const dateSlug = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Tegucigalpa",
    });
    const doc = createSimplePdfDocument(
      response,
      `reporte-por-vencer-${dateSlug}.pdf`,
      "Reporte de Productos por Vencer",
    );

    const lotesData = lotes.map((lote) => {
      const fechaVenc = new Date(lote.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diasParaVencer = Math.round(
        (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        codigo: lote.Producto.codigo,
        nombre: lote.Producto.nombre,
        cantidad: Number(lote.cantidad || 0),
        fecha_vencimiento: formatDateOnly(lote.fecha_vencimiento),
        dias_para_vencer: diasParaVencer,
        estado: diasParaVencer < 0 ? "Vencido" : diasParaVencer <= 7 ? "Critico" : diasParaVencer <= 30 ? "Advertencia" : "Monitorear",
      };
    });

    const vencidos = lotesData.filter((l) => l.dias_para_vencer < 0).length;
    const porVencer = lotesData.length - vencidos;

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`Ventana evaluada: ${diasRaw} dias`)
      .text(`Lotes detectados: ${lotesData.length}`)
      .text(`Vencidos: ${vencidos} | Por vencer: ${porVencer}`)
      .moveDown(1);

    if (!lotesData.length) {
      doc.fontSize(11).fillColor("#111827").text("No hay lotes por vencer en el rango seleccionado.");
      doc.end();
      return;
    }

    const startX = doc.page.margins.left;
    const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cols = [
      { key: "codigo", label: "Codigo", width: 72 },
      { key: "nombre", label: "Producto", width: 190 },
      { key: "cantidad", label: "Cantidad", width: 64 },
      { key: "fecha_vencimiento", label: "Vence", width: 80 },
      { key: "dias_para_vencer", label: "Dias", width: 54 },
      { key: "estado", label: "Estado", width: totalWidth - (72 + 190 + 64 + 80 + 54) },
    ];

    const ensureSpace = (h = 24) => {
      if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    };

    const drawHeader = () => {
      ensureSpace(24);
      const y = doc.y;
      doc.rect(startX, y, totalWidth, 20).fill("#1F2937");
      let x = startX;
      doc.fillColor("#F9FAFB").fontSize(8.5);
      cols.forEach((col) => {
        doc.text(col.label, x + 4, y + 6, {
          width: col.width - 8,
          align: col.key === "nombre" ? "left" : "center",
        });
        x += col.width;
      });
      doc.fillColor("#000");
      doc.y = y + 22;
    };

    drawHeader();
    let odd = false;

    for (const row of lotesData) {
      ensureSpace(22);
      const y = doc.y;
      doc.rect(startX, y, totalWidth, 18).fill(odd ? "#FFFFFF" : "#F9FAFB");
      odd = !odd;

      let x = startX;
      doc.fillColor("#111827").fontSize(8.4);
      cols.forEach((col) => {
        const value = col.key === "nombre" && String(row[col.key]).length > 32
          ? `${String(row[col.key]).slice(0, 29)}...`
          : String(row[col.key]);

        doc.text(value, x + 4, y + 5, {
          width: col.width - 8,
          align: col.key === "nombre" ? "left" : "center",
        });
        x += col.width;
      });

      doc.fillColor("#000");
      doc.y = y + 19;

      if (doc.y + 22 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
      }
    }

    doc.end();
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({
        status: 500,
        message: "Error al exportar reporte por vencer a PDF",
        error: error.message,
      });
      return;
    }
    response.end();
  }
};

let exportLowStockPDF = async (request, response) => {
  try {
    const umbralRaw =
      request.query.umbral !== undefined ? Number(request.query.umbral) : 10;

    if (!Number.isInteger(umbralRaw) || umbralRaw < 0) {
      return response.status(400).json({
        status: 400,
        message: "El umbral debe ser un numero entero no negativo",
      });
    }

    const productos = await Producto.findAll({
      where: { activo: true },
      attributes: ["codigo", "nombre"],
      include: [
        {
          model: Inventario,
          attributes: ["cantidad"],
          where: { lote_activo: true },
          required: false,
        },
      ],
      order: [["nombre", "ASC"]],
    });

    const bajoStock = productos
      .map((prod) => {
        const stockTotal = (prod.Inventarios || []).reduce(
          (sum, lote) => sum + Number(lote.cantidad || 0),
          0,
        );
        return {
          codigo: prod.codigo,
          nombre: prod.nombre,
          stock: stockTotal,
          umbral: umbralRaw,
        };
      })
      .filter((prod) => prod.stock < umbralRaw)
      .sort((a, b) => a.stock - b.stock);

    const dateSlug = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Tegucigalpa",
    });
    const doc = createSimplePdfDocument(
      response,
      `reporte-bajo-stock-${dateSlug}.pdf`,
      "Reporte de Productos con Bajo Stock",
    );

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`Umbral aplicado: ${umbralRaw} unidades`)
      .text(`Productos detectados: ${bajoStock.length}`)
      .moveDown(1);

    if (!bajoStock.length) {
      doc.fontSize(11).fillColor("#111827").text("No hay productos por debajo del umbral seleccionado.");
      doc.end();
      return;
    }

    const startX = doc.page.margins.left;
    const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cols = [
      { key: "codigo", label: "Codigo", width: 90 },
      { key: "nombre", label: "Producto", width: 260 },
      { key: "stock", label: "Stock", width: 90 },
      { key: "umbral", label: "Umbral", width: totalWidth - (90 + 260 + 90) },
    ];

    const ensureSpace = (h = 24) => {
      if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    };

    const drawHeader = () => {
      ensureSpace(24);
      const y = doc.y;
      doc.rect(startX, y, totalWidth, 20).fill("#1F2937");
      let x = startX;
      doc.fillColor("#F9FAFB").fontSize(8.5);
      cols.forEach((col) => {
        doc.text(col.label, x + 4, y + 6, {
          width: col.width - 8,
          align: col.key === "nombre" ? "left" : "center",
        });
        x += col.width;
      });
      doc.fillColor("#000");
      doc.y = y + 22;
    };

    drawHeader();
    let odd = false;
    for (const row of bajoStock) {
      ensureSpace(22);
      const y = doc.y;
      doc.rect(startX, y, totalWidth, 18).fill(odd ? "#FFFFFF" : "#F9FAFB");
      odd = !odd;

      let x = startX;
      doc.fillColor("#111827").fontSize(8.4);
      cols.forEach((col) => {
        const value = col.key === "nombre" && String(row[col.key]).length > 42
          ? `${String(row[col.key]).slice(0, 39)}...`
          : String(row[col.key]);

        doc.text(value, x + 4, y + 5, {
          width: col.width - 8,
          align: col.key === "nombre" ? "left" : "center",
        });
        x += col.width;
      });
      doc.fillColor("#000");
      doc.y = y + 19;

      if (doc.y + 22 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
      }
    }

    doc.end();
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({
        status: 500,
        message: "Error al exportar reporte de bajo stock a PDF",
        error: error.message,
      });
      return;
    }
    response.end();
  }
};

let exportInventarioPDF = async (request, response) => {
  try {
    const { whereProducto, whereInventario, proveedorId } = buildInventarioFilters(request.query);
    const productos = await Producto.findAll({
      where: whereProducto,
      attributes: ["id", "codigo", "nombre", "imagen", "activo"],
      include: [
        {
          model: Inventario,
          where: whereInventario,
          attributes: [
            "id",
            "cantidad",
            "cantidad_inicial",
            "fecha_compra",
            "fecha_vencimiento",
            "lote_activo",
            "precio_costo",
            "precio_venta",
          ],
          include: [
            {
              model: LoteProveedor,
              attributes: ["id_prov"],
              where: proveedorId ? { id_prov: proveedorId } : undefined,
              required: Boolean(proveedorId),
              include: [
                {
                  model: Proveedor,
                  attributes: ["nombre", "telefono"],
                },
              ],
            },
          ],
          required: Object.keys(whereInventario).length > 0 || Boolean(proveedorId),
        },
      ],
      order: [
        ["nombre", "ASC"],
        [Inventario, "fecha_vencimiento", "ASC"],
        [Inventario, "createdAt", "ASC"],
      ],
    });

    const now = new Date();
    const dateSlug = now.toLocaleDateString("en-CA", {
      timeZone: "America/Tegucigalpa",
    });
    const generatedAtHn = now.toLocaleString("es-HN", {
      timeZone: "America/Tegucigalpa",
      hour12: true,
    });
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="inventario-completo-${dateSlug}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(response);

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const money = (n) => `L. ${Number(n || 0).toFixed(2)}`;
    const dateOnly = (value) => {
      if (!value) return "-";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toISOString().slice(0, 10);
    };
    const clampText = (value, max = 28) => {
      const text = String(value || "");
      return text.length > max ? `${text.slice(0, max - 3)}...` : text;
    };

    const drawPageHeader = (isFirstPage) => {
      const x = doc.page.margins.left;
      const y = doc.page.margins.top;

      doc
        .rect(x, y, contentWidth, isFirstPage ? 54 : 44)
        .fill("#F3F4F6");

      doc
        .fillColor("#111827")
        .fontSize(isFirstPage ? 16 : 13)
        .text("Reporte de Inventario", x + 12, y + 10);

      doc
        .fillColor("#4B5563")
        .fontSize(9)
        .text(`Generado: ${generatedAtHn} | Generado por: Admin`, x + 12, y + (isFirstPage ? 31 : 26));

      doc.fillColor("#000");
      doc.y = y + (isFirstPage ? 66 : 56);
    };

    doc.on("pageAdded", () => drawPageHeader(false));
    drawPageHeader(true);

    const ensureSpace = (requiredHeight = 60) => {
      const limit = doc.page.height - doc.page.margins.bottom;
      if (doc.y + requiredHeight > limit) {
        doc.addPage();
      }
    };

    const totalLotes = productos.reduce(
      (sum, prod) => sum + ((prod.Inventarios || []).length),
      0,
    );
    const stockGlobal = productos.reduce((sum, prod) => {
      const stockProd = (prod.Inventarios || []).reduce(
        (s, lote) => s + Number(lote.cantidad || 0),
        0,
      );
      return sum + stockProd;
    }, 0);

    ensureSpace(62);
    const summaryX = doc.page.margins.left;
    const summaryY = doc.y;
    const summaryH = 52;
    doc.roundedRect(summaryX, summaryY, contentWidth, summaryH, 6).fill("#EEF2FF");

    const metrics = [
      { label: "Productos", value: String(productos.length) },
      { label: "Lotes", value: String(totalLotes) },
      { label: "Stock total", value: String(stockGlobal) },
      { label: "Fecha", value: dateSlug },
    ];
    const metricWidth = contentWidth / metrics.length;

    metrics.forEach((metric, idx) => {
      const metricX = summaryX + idx * metricWidth;
      doc
        .fillColor("#4B5563")
        .fontSize(8.5)
        .text(metric.label, metricX + 8, summaryY + 9, {
          width: metricWidth - 16,
          align: "center",
        })
        .fillColor("#111827")
        .fontSize(11)
        .text(metric.value, metricX + 8, summaryY + 24, {
          width: metricWidth - 16,
          align: "center",
        });
    });

    doc.fillColor("#000");
    doc.y = summaryY + summaryH + 12;

    if (!productos.length) {
      doc.fontSize(12).text("No hay productos registrados en inventario.");
      doc.end();
      return;
    }

    for (const prod of productos) {
      ensureSpace(95);
      const lotes = prod.Inventarios || [];
      const stockTotal = lotes.reduce((sum, l) => sum + Number(l.cantidad || 0), 0);

      const sectionX = doc.page.margins.left;
      const sectionY = doc.y;
      doc.roundedRect(sectionX, sectionY, contentWidth, 42, 6).fill("#F9FAFB");
      doc
        .fillColor("#111827")
        .fontSize(12)
        .text(`${prod.nombre}`, sectionX + 10, sectionY + 9)
        .fillColor("#4B5563")
        .fontSize(9)
        .text(`Codigo: ${prod.codigo}`, sectionX + 10, sectionY + 26)
        .text(`Estado: ${prod.activo ? "Activo" : "Inactivo"}`, sectionX + 175, sectionY + 26)
        .text(`Stock: ${stockTotal}`, sectionX + 295, sectionY + 26)
        .text(`Lotes: ${lotes.length}`, sectionX + 395, sectionY + 26)
        .fillColor("#000");
      doc.y = sectionY + 52;

      if (!lotes.length) {
        doc
          .fontSize(9.5)
          .fillColor("#6B7280")
          .text("Sin lotes asociados.")
          .fillColor("#000");
        doc.moveDown();
        continue;
      }

      const tableX = doc.page.margins.left;
      const headerY = doc.y;
      const cols = [
        { key: "lote", label: "Lote", width: 42 },
        { key: "estado", label: "Estado", width: 52 },
        { key: "cantidad", label: "Cantidad", width: 54 },
        { key: "compra", label: "Compra", width: 58 },
        { key: "vence", label: "Vence", width: 58 },
        { key: "costo", label: "Costo", width: 58 },
        { key: "venta", label: "Venta", width: 58 },
        { key: "proveedor", label: "Proveedor(es)", width: 135 },
      ];

      const drawTableHeader = () => {
        ensureSpace(28);
        const y = doc.y;
        doc.rect(tableX, y, contentWidth, 20).fill("#1F2937");

        let x = tableX;
        doc.fillColor("#F9FAFB").fontSize(8.5);
        for (const col of cols) {
          doc.text(col.label, x + 4, y + 6, {
            width: col.width - 8,
            align: col.key === "proveedor" ? "left" : "center",
          });
          x += col.width;
        }
        doc.fillColor("#000");
        doc.y = y + 22;
      };

      drawTableHeader();
      let isOdd = false;
      for (const lote of lotes) {
        ensureSpace(22);

        const rowY = doc.y;
        doc.rect(tableX, rowY, contentWidth, 18).fill(isOdd ? "#FFFFFF" : "#F9FAFB");
        isOdd = !isOdd;

        const relaciones = lote.LoteProveedors || [];
        const proveedores = relaciones
          .map((rel) => rel?.Proveedor)
          .filter(Boolean)
          .map((p) => `${p.nombre}${p.telefono ? ` (${p.telefono})` : ""}`)
          .join(", ");

        const row = {
          lote: `#${lote.id}`,
          estado: lote.lote_activo ? "Activo" : "Inactivo",
          cantidad: `${lote.cantidad}/${lote.cantidad_inicial}`,
          compra: dateOnly(lote.fecha_compra),
          vence: dateOnly(lote.fecha_vencimiento),
          costo: money(lote.precio_costo),
          venta: money(lote.precio_venta),
          proveedor: clampText(proveedores || "No asociado", 38),
        };

        let x = tableX;
        doc.fillColor("#111827").fontSize(8.3);
        for (const col of cols) {
          doc.text(row[col.key], x + 4, rowY + 5, {
            width: col.width - 8,
            align: col.key === "proveedor" ? "left" : "center",
          });
          x += col.width;
        }

        doc.fillColor("#000");
        doc.y = rowY + 19;

        if (doc.y + 22 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          drawTableHeader();
        }
      }

      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    if (error.message && error.message.startsWith("El filtro")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
    if (error.message && error.message.startsWith("Debe ingresar")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
    if (error.message && error.message.startsWith("El nombre")) {
      return response.status(400).json({ status: 400, message: error.message });
    }
    if (!response.headersSent) {
      response.status(500).json({
        status: 500,
        message: "Error al exportar inventario a PDF",
        error: error.message,
      });
      return;
    }
    response.end();
  }
};

module.exports = {
  createInventario,
  getInventarios,
  getInventarioByCodigo,
  updateInventario,
  getAlertasBajoStock,
  getAlertasPorVencer,
  getReporteStockTotal,
  exportExpiringPDF,
  exportLowStockPDF,
  exportInventarioPDF,
};
