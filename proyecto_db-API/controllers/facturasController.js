const { Factura, Venta, DetalleFactura } = require('../models');

const getFacturasPorFecha = async (request, response) => {
  try {

    const { fecha } = request.query;

    const facturas = await Factura.findAll({
      where: { fecha },
      include: [
        { model: Venta },
        { model: DetalleFactura }
      ]
    });

    response.status(200).json(facturas);

  } catch (error) {

    response.status(500).json({
      message: "Error obteniendo facturas por fecha",
      error: error.message
    });

  }
};



module.exports = {
  getFacturasPorFecha,
  
};