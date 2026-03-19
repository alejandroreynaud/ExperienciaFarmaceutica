const db = require("../config/db");

exports.getNotificaciones = async (req, res) => {
  try {

    // 🔴 1. BAJO STOCK
    const queryBajoStock = `
      SELECT 
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

    // 🟡 2. PRÓXIMOS A VENCER
    const queryVencer = `
      SELECT 
        p.nombre,
        i.cantidad,
        DATEDIFF(i.fecha_vencimiento, CURDATE()) AS dias_restantes
      FROM inventario i
      JOIN productos p ON i.id_prod = p.id_prod
      WHERE i.lote_activo = true
        AND i.cantidad > 0
        AND i.fecha_vencimiento IS NOT NULL
        AND DATEDIFF(i.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 30
    `;

    const [bajoStock] = await db.query(queryBajoStock);
    const [vencer] = await db.query(queryVencer);

    const notificaciones = [];

    // 🔴 Procesar bajo stock
    bajoStock.forEach(item => {
      notificaciones.push({
        tipo: "bajo_stock",
        mensaje: `${item.nombre} tiene bajo stock (${item.stock_actual} unidades)`,
        prioridad: "media"
      });
    });

    // 🟡 Procesar vencimientos
    vencer.forEach(item => {
      let prioridad = "media";

      if (item.dias_restantes <= 7) prioridad = "alta";
      if (item.dias_restantes <= 2) prioridad = "critica";

      notificaciones.push({
        tipo: "vencimiento",
        mensaje: `${item.nombre} vence en ${item.dias_restantes} días`,
        prioridad
      });
    });

    // 🔥 ordenar por prioridad
    const prioridadOrden = {
      critica: 1,
      alta: 2,
      media: 3
    };

    notificaciones.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

    res.json(notificaciones);

  } catch (error) {
    console.error("Error en notificaciones:", error);
    res.status(500).json({
      message: "Error obteniendo notificaciones"
    });
  }
};