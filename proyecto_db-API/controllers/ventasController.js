const { Op } = require("sequelize");
const {
  Venta,
  Factura,
  DetalleFactura,
  Movimiento,
  CuentaPorCobrar,
  Inventario,
  Producto,
  Cliente,
  sequelize,
} = require("../models");
const db = require("../config/config");

const getVentasHoy = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(total), 0) AS total,
        COUNT(*) AS cantidad_ventas
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE()
        AND estado = true
    `;

    const [rows] = await db.query(query);

    res.json({
      total: parseFloat(rows[0].total),
      cantidad_ventas: rows[0].cantidad_ventas,
    });
  } catch (error) {
    console.error("Error en getVentasHoy:", error);
    res.status(500).json({
      message: "Error obteniendo ventas del día",
    });
  }
};

const getVentasMensual = async (req, res) => {
  try {
    const query = `
      SELECT 
        MONTH(fecha) AS mes_num,
        COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE YEAR(fecha) = YEAR(CURRENT_DATE())
        AND estado = true
      GROUP BY mes_num
      ORDER BY mes_num ASC
    `;

    const [rows] = await db.query(query);

    // Nombres de meses
    const meses = {
      1: "Ene",
      2: "Feb",
      3: "Mar",
      4: "Abr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Ago",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dic",
    };

    // Inicializar todos los meses en 0
    const resultado = [
      { mes: "Ene", total: 0 },
      { mes: "Feb", total: 0 },
      { mes: "Mar", total: 0 },
      { mes: "Abr", total: 0 },
      { mes: "May", total: 0 },
      { mes: "Jun", total: 0 },
      { mes: "Jul", total: 0 },
      { mes: "Ago", total: 0 },
      { mes: "Sep", total: 0 },
      { mes: "Oct", total: 0 },
      { mes: "Nov", total: 0 },
      { mes: "Dic", total: 0 },
    ];

    // Llenar con datos reales
    rows.forEach((row) => {
      const nombreMes = meses[row.mes_num];

      const index = resultado.findIndex((m) => m.mes === nombreMes);
      if (index !== -1) {
        resultado[index].total = parseFloat(row.total);
      }
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error en ventas mensuales:", error);
    res.status(500).json({
      message: "Error obteniendo ventas mensuales",
    });
  }
};

const getVentasSemanal = async (req, res) => {
  try {
    const query = `
      SELECT 
        DAYOFWEEK(fecha) AS dia_num,
        COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURRENT_DATE(), 1)
        AND estado = true
      GROUP BY dia_num
    `;

    const [rows] = await db.query(query);

    // Mapeo de días
    const dias = {
      1: "Dom",
      2: "Lun",
      3: "Mar",
      4: "Mié",
      5: "Jue",
      6: "Vie",
      7: "Sáb",
    };

    // Inicializar semana completa en 0
    const semana = [
      { dia: "Lun", total: 0 },
      { dia: "Mar", total: 0 },
      { dia: "Mié", total: 0 },
      { dia: "Jue", total: 0 },
      { dia: "Vie", total: 0 },
      { dia: "Sáb", total: 0 },
      { dia: "Dom", total: 0 },
    ];

    // Llenar con datos reales
    rows.forEach((row) => {
      const nombreDia = dias[row.dia_num];

      const index = semana.findIndex((d) => d.dia === nombreDia);
      if (index !== -1) {
        semana[index].total = parseFloat(row.total);
      }
    });

    res.json(semana);
  } catch (error) {
    console.error("Error en ventas semanales:", error);
    res.status(500).json({
      message: "Error obteniendo ventas semanales",
    });
  }
};

let getVentasFecha = async (request, response) => {
  try {
    let whereCondition = {};

    if (request.query.fecha) {
      whereCondition = sequelize.where(
        sequelize.fn("DATE", sequelize.col("Venta.fecha")),
        request.query.fecha
      );
    }

    const ventas = await Venta.findAll({
      where: whereCondition,
      include: [
        {
          model: Factura,
          include: [
            {
              model: DetalleFactura,
              include: [
                {
                  model: Inventario,
                  include: [
                    {
                      model: Producto,
                      attributes: ["id", "nombre", "codigo"],
                    },
                  ],
                  attributes: ["id", "precio_venta"],
                },
              ],
              attributes: ["id", "cantidad", "subtotal"],
            },
          ],
          attributes: ["id", "num_factura", "fecha"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    if (!ventas || ventas.length === 0) {
      return response.status(204).json({
        status: 204,
        message: "No se encontraron ventas",
      });
    }

    response.status(200).json({
      status: 200,
      data: ventas,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

let getVentaById = async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        {
          model: Factura,
          include: [
            {
              model: DetalleFactura,
              include: [
                {
                  model: Inventario,
                  include: [
                    {
                      model: Producto,
                      attributes: ["id", "nombre", "codigo"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    res.json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

let createVenta = async (request, response) => {
 const t = await sequelize.transaction();

  try {
    const { id_vendedor, id_cliente, metodo_pago, fecha, productos } = request.body;

    // ── Validaciones básicas ──────────────────────────────────────────────────

    if (!id_vendedor) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: "El id_vendedor es obligatorio" });
    }

    if (!Number.isInteger(Number(id_vendedor)) || Number(id_vendedor) <= 0) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: "id_vendedor debe ser un entero positivo" });
    }

    if (!metodo_pago?.trim()) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: "El metodo_pago es obligatorio" });
    }

    const metodosPermitidos = ["efectivo", "credito", "tarjeta", "transferencia"];
    if (!metodosPermitidos.includes(metodo_pago.trim().toLowerCase())) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: `metodo_pago debe ser uno de: ${metodosPermitidos.join(", ")}` });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: "Debe enviar al menos un producto" });
    }

    // Crédito requiere cliente
    if (metodo_pago.trim().toLowerCase() === "credito" && !id_cliente) {
      await t.rollback();
      return response.status(400).json({ status: 400, message: "Las ventas a crédito requieren id_cliente" });
    }


    if (fecha !== undefined && fecha !== null) {
      const fechaParseada = new Date(fecha);
      if (isNaN(fechaParseada.getTime())) {
        await t.rollback();
        return response.status(400).json({ status: 400, message: "La fecha debe ser una fecha válida (ej: YYYY-MM-DD)" });
      }
    }

    // Validar cada item del carrito antes de tocar la BD
    for (const item of productos) {
      if (!item.codigo && !item.nombre) {
        await t.rollback();
        return response.status(400).json({ status: 400, message: "Cada producto debe tener codigo o nombre" });
      }

      if (item.codigo !== undefined && item.codigo.trim() === "") {
        await t.rollback();
        return response.status(400).json({ status: 400, message: "El codigo no puede ser una cadena vacía" });
      }

      if (item.nombre !== undefined && item.nombre.trim() === "") {
        await t.rollback();
        return response.status(400).json({ status: 400, message: "El nombre no puede ser una cadena vacía" });
      }

      const cant = Number(item.cantidad);
      if (!Number.isInteger(cant) || cant <= 0) {
        await t.rollback();
        return response.status(400).json({
          status: 400,
          message: `La cantidad de "${item.codigo || item.nombre}" debe ser un entero positivo`,
        });
      }
    }

    // ── FEFO: procesar cada producto ──────────────────────────────────────────

    // lotesConsumidos: datos para DetalleFactura y Movimiento
    const lotesConsumidos = [];
    let totalVenta = 0;

    for (const item of productos) {
      const cantidadSolicitada = Number(item.cantidad);

      // Buscar producto — codigo tiene prioridad
      const whereProducto = item.codigo
        ? { codigo: item.codigo.trim() }
        : { nombre: item.nombre.trim() };

      const producto = await Producto.findOne({
        where: whereProducto,
        attributes: ["id", "codigo", "nombre", "activo"],
        transaction: t,
      });

      if (!producto) {
        await t.rollback();
        return response.status(404).json({
          status: 404,
          message: `Producto no encontrado: "${item.codigo || item.nombre}"`,
        });
      }

      if (producto.activo === false) {
        await t.rollback();
        return response.status(409).json({
          status: 409,
          message: `El producto "${producto.nombre}" está inactivo`,
        });
      }

      // Lotes activos con stock, ordenados FEFO
      const lotes = await Inventario.findAll({
        where: {
          id_prod: producto.id,
          lote_activo: true,
          cantidad: { [Op.gt]: 0 },
        },
        order: [
          ["fecha_vencimiento", "ASC"],
          ["fecha_compra", "ASC"],
        ],
        transaction: t,
      });

      if (!lotes.length) {
        await t.rollback();
        return response.status(409).json({
          status: 409,
          message: `Sin stock disponible para "${producto.nombre}"`,
        });
      }

      // Verificar stock total suficiente antes de descontar
      const stockDisponible = lotes.reduce((sum, l) => sum + l.cantidad, 0);
      if (stockDisponible < cantidadSolicitada) {
        await t.rollback();
        return response.status(409).json({
          status: 409,
          message: `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}`,
        });
      }

      // Descontar lote por lote (FEFO)
      let pendiente = cantidadSolicitada;

      for (const lote of lotes) {
        if (pendiente <= 0) break;

        const stockAntes = lote.cantidad;
        const descontado = Math.min(pendiente, lote.cantidad);
        const precioVenta = parseFloat(lote.precio_venta);
        const subtotal = descontado * precioVenta;

        lote.cantidad -= descontado;
        pendiente -= descontado;

        if (lote.cantidad === 0) lote.lote_activo = false;

        await lote.save({ transaction: t });

        lotesConsumidos.push({
          id_lote: lote.id,
          id_producto: producto.id,
          cantidad: descontado,
          subtotal,
          stock_antes: stockAntes,
          stock_despues: lote.cantidad,
        });

        totalVenta += subtotal;
      }
    }

    // ── Crear Venta ───────────────────────────────────────────────────────────

    const venta = await Venta.create(
      {
        id_vendedor,
        id_cliente: id_cliente || null,
        total: parseFloat(totalVenta.toFixed(2)),
        metodo_pago: metodo_pago.trim(),
        fecha: fecha ? new Date(fecha) : new Date(),
        estado: true,
      },
      { transaction: t },
    );

    // ── Generar num_factura automático ────────────────────────────────────────
    // Formato: FAC-YYYYMMDD-{id_venta}
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const numFactura = `FAC-${yyyy}${mm}${dd}-${venta.id}`;

    // ── Crear Factura ─────────────────────────────────────────────────────────

    const factura = await Factura.create(
      {
        id_venta: venta.id,
        num_factura: numFactura,
        fecha: venta.fecha,
        url_imagen: null,
        hash_doc: null,
      },
      { transaction: t },
    );

    // ── Crear DetalleFactura (un registro por lote consumido) ─────────────────

    await DetalleFactura.bulkCreate(
      lotesConsumidos.map((lc) => ({
        id_factura: factura.id,
        id_lote: lc.id_lote,
        cantidad: lc.cantidad,
        subtotal: lc.subtotal,
      })),
      { transaction: t },
    );

    // ── Registrar Movimientos (auditoría por lote) ───────────────────────────

    await Movimiento.bulkCreate(
      lotesConsumidos.map((lc) => ({
        id_lote: lc.id_lote,
        id_producto: lc.id_producto,
        tipo: "VENTA",
        id_referencia: factura.id,
        tabla_referencia: "Facturas",
        cantidad: lc.cantidad,
        stock_antes: lc.stock_antes,
        stock_despues: lc.stock_despues,
        id_usuario: id_vendedor,
        fecha: venta.fecha,
      })),
      { transaction: t },
    );

    // ── CuentaPorCobrar (solo si es crédito) ──────────────────────────────────

    let cuentaPorCobrar = null;
    if (metodo_pago.trim().toLowerCase() === "credito") {
      cuentaPorCobrar = await CuentaPorCobrar.create(
        {
          id_factura: factura.id,
          id_cliente: id_cliente,
          saldo_pendiente: venta.total,
          estado: true,
          fecha_creado: new Date(),
        },
        { transaction: t },
      );
    }

    // ── Todo OK: confirmar ────────────────────────────────────────────────────

    await t.commit();

    const respuesta = {
      status: 201,
      message: "Venta creada exitosamente",
      data: {
        venta: {
          id: venta.id,
          id_vendedor: venta.id_vendedor,
          id_cliente: venta.id_cliente,
          total: venta.total,
          metodo_pago: venta.metodo_pago,
          fecha: venta.fecha,
          estado: venta.estado,
        },
        factura: {
          id: factura.id,
          num_factura: factura.num_factura,
          fecha: factura.fecha,
        },
        detalle: lotesConsumidos.map((lc) => ({
          id_lote: lc.id_lote,
          cantidad: lc.cantidad,
          subtotal: lc.subtotal,
        })),
      },
    };

    if (cuentaPorCobrar) {
      respuesta.data.cuenta_por_cobrar = {
        id: cuentaPorCobrar.id,
        saldo_pendiente: cuentaPorCobrar.saldo_pendiente,
        estado: cuentaPorCobrar.estado,
      };
    }

    response.status(201).json(respuesta);
  } catch (error) {
    await t.rollback();
    console.error("Error al crear venta:", error);
    response.status(500).json({
      status: 500,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

let getVentasByCliente = async (request, response) => {
  try {
    const { id_cliente } = request.params;

    let ventas = await Venta.findAll({
      where: {
        id_cliente: id_cliente,
      },
    });

    if (ventas.length <= 0) {
      response.status(204).json({
        status: 204,
        message:
          "No se encontraron ventas para el cliente con id " + id_cliente,
      });
    } else {
      response.status(200).json({
        status: 200,
        data: ventas,
      });
    }
  } catch (error) {
    response.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
const getProductosVenta = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { activo: true },
      attributes: ["id", "nombre", "codigo"],
      include: [
        {
          model: Inventario,
          where: {
            lote_activo: true,
            cantidad: { [Op.gt]: 0 },
          },
          attributes: ["precio_venta", "cantidad"],
          required: true,
        },
      ],
    });

    // Agrupar stock total y precio_venta por producto
    const data = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      precio_venta: parseFloat(p.Inventarios[0].precio_venta),
      stock: p.Inventarios.reduce((sum, l) => sum + l.cantidad, 0),
    }));

    res.status(200).json({ status: 200, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports = {
  getVentasFecha,
  getVentaById,
  createVenta,
  getVentasByCliente,
  getVentasSemanal,
  getVentasMensual,
  getVentasHoy,
  getProductosVenta,

};