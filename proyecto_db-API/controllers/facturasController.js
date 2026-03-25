const { Factura, Venta, DetalleFactura, Inventario, Producto, sequelize } = require('../models');
const getFacturasFecha = async (req, res) => {
  try {
    const { fecha } = req.query;

    const facturas = await Factura.findAll({
      where: fecha
        ? sequelize.where(
            sequelize.fn("DATE", sequelize.col("Factura.fecha")),
            fecha
          )
        : {},
      include: [
        {
          model: Venta,
        },
        {
          model: DetalleFactura,
          include: [
            {
              model: Inventario,
              include: [
                {
                  model: Producto,
                  attributes: ["nombre", "codigo"],
                },
              ],
            },
          ],
        },
      ],
    });

    res.json(facturas);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error obteniendo facturas",
      error: error.message,
    });
  }
};


const getFacturaByNumero = async (req, res) => {
  try {
    const { num_factura } = req.params;

    const factura = await Factura.findOne({
      where: { num_factura },
      include: [
        {
          model: Venta,
          attributes: ["id", "total", "metodo_pago", "fecha"],
        },
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
              attributes: ["precio_venta"],
            },
          ],
          attributes: ["cantidad", "subtotal"],
        },
      ],
    });

    if (!factura) {
      return res.status(404).json({
        message: "Factura no encontrada",
      });
    }

    res.status(200).json(factura);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error obteniendo factura",
      error: error.message,
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
  getFacturaByNumero,
  createFactura
};