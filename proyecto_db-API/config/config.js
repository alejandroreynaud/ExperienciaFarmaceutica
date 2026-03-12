require("dotenv").config();

const{
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  DB_DIALECT
} = process.env;

module.exports ={

  development: {
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'expfarma',
    database: DB_NAME || 'proyecto_db',
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 5430,
    dialect: DB_DIALECT || 'postgres'
  },
  test: {
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'expfarma',
    database: process.env.DB_NAME_TEST || `${DB_NAME}_test`,
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 5430,
    dialect: DB_DIALECT || 'postgres'
  },
  production: {
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'expfarma',
    database: DB_NAME || 'proyecto_db',
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 5430,
    dialect: DB_DIALECT || 'postgres'
  }
}


