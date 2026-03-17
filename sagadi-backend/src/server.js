const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

// Importar rotas
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const aerodromoRoutes = require('./routes/aerodromoRoutes')
const areaInspecaoRoutes = require('./routes/areaInspecaoRoutes')
const findingRoutes = require('./routes/findingRoutes')

const app = express()
const PORT = process.env.PORT || 3000

// Configuração CORS mais permissiva para desenvolvimento
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rotas
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/aerodromos', aerodromoRoutes)
app.use('/api/areas-inspecao', areaInspecaoRoutes)
app.use('/api/findings', findingRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  })
})

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro global:', err)
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Ambiente: ${process.env.NODE_ENV}`)
  console.log(`API: http://localhost:${PORT}`)
})