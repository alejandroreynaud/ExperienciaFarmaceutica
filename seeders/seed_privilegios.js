const privileges = [
    //Inventario
  { nombre: "inventario.ver", desc: "Ver inventario" },
  { nombre: "inventario.crear", desc: "Crear productos" },
  { nombre: "inventario.editar", desc: "Editar productos" },
  { nombre: "inventario.ajustar", desc: "Ajustar inventario" },
  { nombre: "inventario.ver_movimientos", desc: "Ver movimientos del inventario"},
  { nombre: "inventario.ver_lotes", desc: "Ver lista de lotes"},

  //Ventas
  { nombre: "ventas.crear", desc: "Registrar ventas" },
  { nombre: "ventas.ver", desc: "Ver ventas" },
  { nombre: "ventas.cancelar", desc: "Anular ventas" },

  //Clientes
  { nombre: "clientes.crear", desc: "Crear clientes" },
  { nombre: "clientes.ver", desc: "Ver clientes" },
  { nombre: "clientes.borrar", desc: "Inactivar cliente"},
  { nombre: "clientes.editar", desc: "Editar cliente"},

  //Facturas
  { nombre: "facturas.ver", desc: "Ver facturas"},
  { nombre: "facturas.generar", desc: "Generar facturas"},
  { nombre: "facturas.descargar", desc: "Descargar facturas"},

  //Usuarios/Seguridad 
  { nombre: "usuarios.crear", desc: "Crear usuarios" },
  { nombre: "usuarios.editar", desc: "Editar usuarios" },
  { nombre: "usuarios.ver", desc: "Ver usuarios activos"},
  { nombre: "usuarios.borrar", desc: "Inactivar usuario"},
  { nombre: "usuario.asignar_rol", desc: "Permiso para asignar roles a usuarios"},
  { nombre: "roles.ver", desc: "Ver lista de roles"},
  { nombre: "roles.crear", desc: "Crear roles"},
  { nombre: "roles.editar", desc: "Editar roles"},
  { nombre: "roles.eliminar", desc: "Eliminar roles"},

  //Reportes
  { nombre: "reportes.ver_ventas", desc: "Ver reporte de ventas"},
  { nombre: "reportes.ver_inventario", desc: "Reporte de productos de inventario"},

  //Proveedores
  { nombre: "proveedores.ver", desc: "Ver lista de proveedores"},
  { nombre: "proveedores.crear", desc: "Crear nuevo proveedor"},
  { nombre: "proveedores.editar", desc: "Editar proveedor existente"},
  { nombre: "proveedores.eliminar", desc: "Eliminar proveedor"},

  //Productos
  { nombre: "productos.ver", desc: "Ver lista de productos"},
  { nombre: "productos.crear", desc: "Crear nuevo producto"},
  { nombre: "productos.editar", desc: "Editar producto existente"},
  { nombre: "productos.eliminar", desc: "Eliminar un producto"},
];

async function seedPrivileges(db) {

  for (const p of privileges) {

    await db.query(`
      INSERT INTO privilegios (nombre, desc)
      VALUES ($1, $2)
      ON CONFLICT (nombre) DO NOTHING
    `, [p.nombre, p.desc]);

  }

}

module.exports = seedPrivileges;