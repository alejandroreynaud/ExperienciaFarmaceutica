const { Venta, sequelize } = require("../models");

exports.getVentasSemanal = async (req, res) => {
  try {
    const query = `
      SELECT 
        DAYOFWEEK(fecha) AS dia_num,
        COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
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
      7: "Sáb"
    };

    // Inicializar semana completa en 0
    const semana = [
      { dia: "Lun", total: 0 },
      { dia: "Mar", total: 0 },
      { dia: "Mié", total: 0 },
      { dia: "Jue", total: 0 },
      { dia: "Vie", total: 0 },
      { dia: "Sáb", total: 0 },
      { dia: "Dom", total: 0 }
    ];

    // Llenar con datos reales
    rows.forEach(row => {
      const nombreDia = dias[row.dia_num];

      const index = semana.findIndex(d => d.dia === nombreDia);
      if (index !== -1) {
        semana[index].total = parseFloat(row.total);
      }
    });

    res.json(semana);

  } catch (error) {
    console.error("Error en ventas semanales:", error);
    res.status(500).json({
      message: "Error obteniendo ventas semanales"
    });
  }
};

let getVentasFecha = async (request, response) => {
    try {

        let ventas;

        if (request.query.fecha) {

            ventas = await Venta.findAll({
                where: sequelize.where(
                    sequelize.fn('DATE', sequelize.col('fecha')),
                    request.query.fecha
                )
            });

        } else {

            ventas = await Venta.findAll();

        }

        if (ventas.length <= 0) {

            response.status(204).json({
                status: 204,
                message: "No se encontraron ventas"
            });

        } else {

            response.status(200).json({
                status: 200,
                data: ventas
            });

        }

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};


let getVentaById = async (request, response) => {
    try {

        let venta = await Venta.findByPk(request.params.id);

        if (!venta) {

            response.status(204).json({
                status: 204,
                message: "Venta no encontrada"
            });

        } else {

            response.status(200).json({
                status: 200,
                data: venta
            });

        }

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let createVenta = async (request, response) => {
    try {

        let venta = await Venta.create(request.body);

        response.status(200).json({
            status: 200,
            data: venta
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};
let getVentasByCliente = async (request, response) => {
    try {

        const { id_cliente } = request.params;

        let ventas = await Venta.findAll({
            where: {
                id_cliente: id_cliente
            }
        });

        if (ventas.length <= 0) {

            response.status(204).json({
                status: 204,
                message: "No se encontraron ventas para el cliente con id " + id_cliente
            });

        } else {

            response.status(200).json({
                status: 200,
                data: ventas
            });

        }

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

module.exports = {
    getVentasFecha,
    getVentaById,
    createVenta,
    getVentasByCliente
    
};
