module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'sagadi_secret_key_2026',
    expiresIn: '7d'
  },
  bcrypt: {
    saltRounds: 10
  }
}