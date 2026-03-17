const express = require('express')
const authController = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

// Rotas públicas
router.post('/login', authController.login)

// Rotas protegidas
router.use(authMiddleware) // Todas as rotas abaixo requerem autenticação
router.post('/logout', authController.logout)
router.get('/me', authController.me)
router.put('/alterar-senha', authController.alterarSenha)

module.exports = router