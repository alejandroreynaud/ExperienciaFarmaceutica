const express = require('express');
const router = express.Router();
const {
  getAllUsuarios,
  getUsuariosFiltrados,
  createUsuario,
  updateUsuario,
  cambiarEstadoUsuario,
  login,
  checkStatus
} = require('../controllers/usuario');

router.post('/login', login);
router.get('/', getAllUsuarios);
router.get('/filtrar', getUsuariosFiltrados);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.patch('/:id/estado', cambiarEstadoUsuario);
router.get('/:id/status', checkStatus);

module.exports = router;