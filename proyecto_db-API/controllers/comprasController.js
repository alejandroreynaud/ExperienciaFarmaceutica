const { Op } = require("sequelize");
const {
    Compra,
    DetalleCompra,
    Inventario,
    LoteProveedor,
    Producto,
    Proveedor,
    sequelize,
} = require("../models");

const RTN_REGEX = /^\d{14}$/;

function buildHondurasTimestamp(fechaBase) {
    const datePart = String(fechaBase || "").slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error("Fecha inválida para la compra");
    }

    const nowHn = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Tegucigalpa" }),
    );
    parsed.setHours(
        nowHn.getHours(),
        nowHn.getMinutes(),
        nowHn.getSeconds(),
        0,
    );

    return parsed;
}

let getCompras = async (request, response) => {
    try {
        const compras = await Compra.findAll({
            include: [
                {
                    model: DetalleCompra,
                    include: [
                        {
                            model: Inventario,
                            attributes: ["id", "id_prod", "fecha_vencimiento"],
                            include: [
                                {
                                    model: Producto,
                                    attributes: ["id", "codigo", "nombre"],
                                },
                                {
                                    model: LoteProveedor,
                                    attributes: ["id_prov"],
                                    include: [
                                        {
                                            model: Proveedor,
                                            attributes: ["id", "nombre", "telefono"],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        response.status(200).json({
            status: 200,
            data: compras,
        });
    } catch (error) {
        response.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};

let getComprasResumen = async (request, response) => {
    try {
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const comprasMes = await Compra.findAll({
            where: {
                fecha: {
                    [Op.gte]: startMonth,
                    [Op.lt]: startNextMonth,
                },
            },
            attributes: ["id", "total"],
        });

        const total_compras = comprasMes.length;
        const suma_total = comprasMes.reduce((acc, c) => acc + Number(c.total || 0), 0);
        const idsComprasMes = comprasMes.map((c) => c.id);

        let total_unidades = 0;
        if (idsComprasMes.length > 0) {
            const detalles = await DetalleCompra.findAll({
                where: {
                    id_compra: { [Op.in]: idsComprasMes },
                },
                attributes: ["cantidad"],
            });
            total_unidades = detalles.reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
        }

        response.status(200).json({
            status: 200,
            data: {
                total_compras,
                suma_total,
                total_unidades,
            },
        });
    } catch (error) {
        response.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};



let getComprasByFecha = async (request, response) => {
    try {

        const { fecha } = request.query;

        if (!fecha) {
            return response.status(400).json({
                status: 400,
                message: "Debe enviar una fecha"
            });
        }

        let compras = await Compra.findAll({
            where: {
                fecha: fecha
            }
        });

        if (compras.length <= 0) {

            return response.status(204).json({
                status: 204,
                message: "No se encontraron compras para esa fecha"
            });

        }

        response.status(200).json({
            status: 200,
            data: compras
        });

    } catch (error) {

        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};

let createCompra = async (request, response) => {
    let tx;
    try {

        // Recibir datos del body
        const { proveedor_id, fecha, total, metodo_pago, id_usuario, detalles, rtn } = request.body;

        const numericTotal = Number(total);
        const proveedorId = Number(proveedor_id);

        // Validar datos
        if (!Number.isInteger(proveedorId) || proveedorId <= 0 || !fecha || !Number.isFinite(numericTotal) || numericTotal <= 0) {
            return response.status(400).json({
                status: 400,
                message: "Proveedor, fecha y total son obligatorios"
            });
        }

        const rtnText = String(rtn || "").trim();
        if (!RTN_REGEX.test(rtnText)) {
            return response.status(400).json({
                status: 400,
                message: "El RTN debe contener exactamente 14 dígitos numéricos",
            });
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return response.status(400).json({
                status: 400,
                message: "Debe enviar al menos un producto en detalles",
            });
        }

        const proveedor = await Proveedor.findByPk(proveedorId);
        if (!proveedor) {
            return response.status(404).json({
                status: 404,
                message: "Proveedor no encontrado",
            });
        }

        tx = await sequelize.transaction();

        const fechaCompraConHora = buildHondurasTimestamp(fecha);

        // Guardar compra en base de datos
        let compra = await Compra.create({
            fecha: fechaCompraConHora,
            total: numericTotal,
            metodo_pago: metodo_pago || "efectivo",
            rtn: rtnText,
            id_usuario: id_usuario || null,
        }, { transaction: tx });

        for (const d of detalles) {
            const productId = Number(d?.id_prod);
            const quantity = Number(d?.cantidad);
            const cost = Number(d?.precio_costo);
            const sale = Number(d?.precio_venta ?? d?.precio_costo);
            const subtotal = Number(d?.subtotal);
            const expiryDate = d?.fecha_vencimiento;

            if (!Number.isInteger(productId) || productId <= 0) {
                throw new Error("Cada detalle debe incluir id_prod válido");
            }
            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new Error("Cada detalle debe incluir cantidad mayor a 0");
            }
            if (!expiryDate) {
                throw new Error("Cada detalle debe incluir fecha_vencimiento");
            }
            if (!Number.isFinite(cost) || cost <= 0) {
                throw new Error("Cada detalle debe incluir precio_costo mayor a 0");
            }
            if (!Number.isFinite(sale) || sale <= 0) {
                throw new Error("Cada detalle debe incluir precio_venta mayor a 0");
            }
            if (!Number.isFinite(subtotal) || subtotal < 0) {
                throw new Error("Cada detalle debe incluir subtotal válido");
            }

            const producto = await Producto.findByPk(productId, { transaction: tx });
            if (!producto) {
                throw new Error(`Producto no encontrado para id ${productId}`);
            }

            const lote = await Inventario.create({
                id_prod: productId,
                cantidad: quantity,
                cantidad_inicial: quantity,
                fecha_compra: fecha,
                fecha_vencimiento: expiryDate,
                lote_activo: true,
                precio_costo: cost,
                precio_venta: sale,
            }, { transaction: tx });

            await LoteProveedor.create({
                id_lote: lote.id,
                id_prov: proveedorId,
            }, { transaction: tx });

            await DetalleCompra.create({
                id_compra: compra.id,
                id_lote: lote.id,
                cantidad: quantity,
                subtotal,
            }, { transaction: tx });
        }

        await tx.commit();

        response.status(201).json({
            status: 201,
            message: "Compra registrada correctamente",
            data: compra
        });

    } catch (error) {
        if (tx) {
            await tx.rollback();
        }

        // Manejo de errores
        response.status(500).json({
            status: 500,
            message: error.message
        });

    }
};


module.exports = {
    getCompras,
    getComprasResumen,
    getComprasByFecha,
    createCompra
};