const roles = [
  "Administrador",
  "Vendedor",
  "Bodega"
];

async function seedRoles(db) {

  for (const r of roles) {

    await db.query(`
      INSERT INTO roles (nombre)
      VALUES ($1)
      ON CONFLICT (nombre) DO NOTHING
    `, [r]);

  }

}

module.exports = seedRoles;