const seedPrivileges = require("./seeders/seed_privileges");
const seedRoles = require("./seeders/seed_roles");
const seedRolePrivileges = require("./seeders/seed_role_privileges");

async function runSeeders(db) {

  await seedPrivileges(db);
  await seedRoles(db);
  await seedRolePrivileges(db);

  console.log("Seeders ejecutados correctamente");

}

module.exports = runSeeders;