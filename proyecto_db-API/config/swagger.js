const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

const docsPath = path.join(__dirname, '../docs');
const swaggerDocument = YAML.load(path.join(docsPath, 'index.yaml'));

const pathsDir = path.join(docsPath, 'paths');
if (fs.existsSync(pathsDir)) {
  const pathFiles = fs.readdirSync(pathsDir).filter((file) => file.endsWith('.yaml'));

  swaggerDocument.paths = swaggerDocument.paths || {};

  pathFiles.forEach((fileName) => {
    const routeName = `/${path.basename(fileName, '.yaml')}`;
    swaggerDocument.paths[routeName] = YAML.load(path.join(pathsDir, fileName));
  });
}

const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: "Experiencia Farmaceutica API Documentation"
  }));
}

module.exports = swaggerSetup;
