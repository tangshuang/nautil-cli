module.exports = {
  before(app, server) {
    const person = {
      name: 'tomy',
      age: 10,
    }
    const parse = (stream) => {
      return new Promise((resolve, reject) => {
        let data = ''
        stream.on('data', (chunk) => {
          data += chunk.toString()
        })
        stream.on('end', () => resolve(data))
        stream.on('error', reject)
      })
    }

    app.get('/api/info', function(req, res) {
      res.json({ time: Date.now() })
    })
    app.get('/api/persons', function(req, res) {
      res.json({ ...person, id: req.query.id, time: Date.now() })
    })

    app.post('/api/persons', async function(req, res) {
      const body = await parse(req)
      const json = JSON.parse(body)
      Object.assign(person, json)
      res.json(body)
    })
  },
}
