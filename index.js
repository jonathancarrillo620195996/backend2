const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.static('dist'))

app.use(express.json())

// Definimos un token para loguear el cuerpo de la petición POST
morgan.token('body', (req) => {
  return req.method === 'POST' || req.method === 'PUT' && req.body && Object.keys(req.body).length
    ? JSON.stringify(req.body)
    : '-'
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// ====== DATOS EN MEMORIA (SIMULACIÓN DE BASE DE DATOS) ======
let persons = [
  {
    id: 1,
    name: 'Arto Hellas',
    number: '040-123456'
  },
  {
    id: 2,
    name: 'Ada Lovelace',
    number: '39-44-5323523'
  },
  {
    id: 3,
    name: 'Dan Abramov',
    number: '12-43-234345'
  },
  {
    id: 4,
    name: 'Mary Poppendieck',
    number: '39-23-6423122'
  }
]

const generateId = () => {
  return Number(Date.now().toString().slice(-3)) + Math.floor(Math.random() * 100)
}

const nameExists = (name) => {
  return persons.some(p => p.name === name)
}

// ====== RUTAS DE LA API ======

app.get('/api/persons', (request, response) => {
  response.json(persons)
})

app.get('/info', (request, response) => {
  const count = persons.length
  const now = new Date()
  const html = `<p>Phonebook has info for ${count} people</p><p>${now}</p>`
  response.send(html)
})

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(p => p.id === id)
  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  persons = persons.filter(p => p.id !== id)
  console.log('Deleting...', id)
  response.status(204).end()
})

app.post('/api/persons', (request, response) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({ error: 'name is missing' })
  }
  if (!body.number) {
    return response.status(400).json({ error: 'number is missing' })
  }
  if (nameExists(body.name)) {
    return response.status(400).json({ error: 'name must be unique' })
  }

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number
  }

  persons = persons.concat(person)
  console.log('Adding...', person)
  response.json(person)
})

// 🚀 RUTA PUT: Implementación de la actualización de un recurso
app.put('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number is missing'
    })
  }

  const personIndex = persons.findIndex(p => p.id === id)

  if (personIndex !== -1) {
    const updatedPerson = {
      ...persons[personIndex], // Mantiene el ID existente
      name: body.name,
      number: body.number
    }

    persons[personIndex] = updatedPerson // Reemplaza el objeto en el array
    console.log('Updating...', updatedPerson)
    response.json(updatedPerson)
  } else {
    response.status(404).json({ error: 'person not found' })
  }
})

// Middleware para rutas inexistentes (API)
app.use((request, response) => {
  response.status(404).send({ error: 'Ruta desconocida' })
})

// ====== INICIO DEL SERVIDOR ======
const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})