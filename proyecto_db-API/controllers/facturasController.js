const { Factura, Venta, DetalleFactura } = require('../models');

const getFacturasFecha = async (request, response) => {
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

const createFactura = async (request, response) => {
  try {

    const { id_venta, num_factura, fecha, url_imagen, hash_doc } = request.body;

    const venta = await Venta.findByPk(id_venta);

    if (!venta) {
      return response.status(404).json({
        message: "La venta no existe"
      });
    }

    const facturaExistente = await Factura.findOne({
      where: { id_venta }
    });

    if (facturaExistente) {
      return response.status(400).json({
        message: "Esta venta ya tiene una factura"
      });
    }

    const factura = await Factura.create({
      id_venta,
      num_factura,
      fecha,
      url_imagen,
      hash_doc
    });

    response.status(201).json(factura);

  } catch (error) {

    response.status(500).json({
      message: "Error creando factura",
      error: error.message
    });

  }
};

module.exports = {
  getFacturasFecha,
  getFacturaId,
  createFactura
};