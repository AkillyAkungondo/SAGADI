const express = require('express')
const userController = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddleware')


const router = express.Router()

// Todas as rotas de utilizador requerem autenticação
router.use(authMiddleware)

// Rotas públicas (para utilizadores autenticados)
router.get('/perfis', userController.listarPerfis)
router.get('/direcoes', userController.listarDirecoes)

// Rotas de utilizador
router.get('/', userController.index)
router.get('/:id', userController.show)
router.post('/', userController.create)
router.put('/:id', userController.update)
router.delete('/:id', userController.delete)

module.exports = router