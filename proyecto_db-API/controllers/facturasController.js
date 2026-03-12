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


const getFacturaId = async (req, res) => {
  try {

    const { id } = req.params;

    const factura = await Factura.findByPk(id, {
      include: [
        { model: Venta },
        { model: DetalleFactura }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        message: "Factura no encontrada"
      });
    }

    res.status(200).json(factura);

  } catch (error) {

    res.status(500).json({
      message: "Error obteniendo factura",
      error: error.message
    });

  }
};

module.exports = {
  getFacturasPorFecha,
  getFacturaId
  
};