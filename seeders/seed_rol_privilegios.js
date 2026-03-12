//Creacion del usuario administrador
async function seedRolePrivileges(db) {

  const adminRole = await db.query(
    `SELECT id_rol FROM roles WHERE nombre = 'Administrador'`
  );

  const privileges = await db.query(
    `SELECT id_privilegio FROM privilegios`
  );

  for (const p of privileges.rows) {

    await db.query(`
      INSERT INTO rol_privilegios (id_rol, id_privilegio)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [adminRole.rows[0].id_rol, p.id_privilegio]);

  }

}

module.exports = seedRolePrivileges;