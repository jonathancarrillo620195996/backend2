require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const Person = require('./models/person')

const app = express()

// Middlewares
app.use(cors())
app.use(express.static('dist'))
app.use(express.json())

// Logger simple (opcional, parecido a requestLogger)
const requestLogger = (request, response, next) => {
  console.log('Method: ', request.method)
  console.log('Path:   ', request.path)
  console.log('Body:   ', request.body)
  console.log('---------------------------')
  next()
}
app.use(requestLogger)

// Morgan: token para body en POST/PUT
morgan.token('body', (req) => {
  return (req.method === 'POST' || req.method === 'PUT') && req.body && Object.keys(req.body).length
    ? JSON.stringify(req.body)
    : '-'
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// RUTAS

// Obtener todas las personas desde MongoDB
app.get('/api/persons', (req, res) => {
  Person.find({}).then(persons => {
    res.json(persons)
  })
})

// Info (número de personas + fecha)
app.get('/info', async (req, res) => {
  const count = await Person.countDocuments({})
  const now = new Date()
  res.send(`<p>Phonebook has info for ${count} people</p><p>${now}</p>`)
})

// Obtener por id
app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

// Borrar por id
app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

// Crear nuevo
app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (!body.name) {
    return res.status(400).json({ error: 'name is missing' })
  }
  if (!body.number) {
    return res.status(400).json({ error: 'number is missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(error => next(error))
})

// Actualizar (PUT)
app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).json({ error: 'name or number is missing' })
  }

  const updated = {
    name: body.name,
    number: body.number
  }

  // runValidators:true for schema validation on update
  Person.findByIdAndUpdate(req.params.id, updated, { new: true, runValidators: true, context: 'query' })
    .then(result => {
      if (result) {
        res.json(result)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

// Middleware para rutas desconocidas
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'Ruta desconocida' })
}
app.use(unknownEndpoint)

// Manejador de errores
const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

// Iniciar servidor
const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
