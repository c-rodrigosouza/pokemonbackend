const http = require('http')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const SECRET = 'pokemonsecret'
const axios = require('axios')
const port = 3001
var cors = require('cors')
const blacklist = []

app.use(cors())
app.use(bodyParser.json())

const users = [
  { name: 'admin', password: 'admin' },
  { name: 'teste', password: '123' }
]

function verifyJWT(req, res, next) {
  const token = req.headers['x-access-token']
  const index = blacklist.findIndex(item => item === token)
  if (index !== -1) return res.status(401).end()

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).end()
    req.userId = decoded.userId
    next()
  })
}

/* Realizar Login (Como não foi solicitado banco de dados, criei uma váriavel chamada "users" com usuário e senha ficticios, mas só valida se 
usuário e password estiverem corretos conforme a lista). */
app.post('/login', (req, res) => {
  let userVerify = false
  users.forEach(value => {
    if (value.name === req.body.user) {
      if (value.password === req.body.password) {
        userVerify = true
      }
    }
  })
  if (userVerify) {
    const token = jwt.sign({ userId: 1 }, SECRET, { expiresIn: 18000 })
    return res.json({ auth: true, token })
  }
  res.json({ auth: false, msg: "Usuário ou senha inválidos." })
})

// Realizar logout
app.post('/logout', (req, res) => {
  blacklist.push(req.headers['x-access-token'])
  res.json({ msg: 'Sessão encerrada' }).end()
})

const server = http.createServer(app)
server.listen(port)
console.log(`Servidor iniciado na porta ${port}.`)

// verificar se o token é válido
app.get('/validatetoken', (req, res) => {
  const token = req.headers['x-access-token']
  const index = blacklist.findIndex(item => item === token)
  if (index !== -1) return res.json({ validToken: false })

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.json({ validToken: false })
    req.userId = decoded.userId

    return res.json({ validToken: true })
  })
})

//GET lista de pokemons
app.get('/pokemon', verifyJWT, async (req, res) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/?offset=${req.query.offset}&limit=${req.query.limit}`)
    return res.json(response.data)
  } catch (error) {
    return 401
  }
})

//GET informações sobre pokemon
app.get('/pokemon/:id', verifyJWT, async (req, res) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${req.params.id}`)
    response.data.return = true
    return res.json(response.data)
  } catch (error) {
    return res.json({ return: false, msg: 'Nada foi encontrado com os parametros enviados.' })
  }
})