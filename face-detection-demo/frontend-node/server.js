const express = require('express')
const app = express()

const port = 8000

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})

// Serve static files from the "public" directory
app.use(express.static('public'))

// log all the incoming requests
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.get('/', (req, res) => {
    res.send('<h1> Hello World </h1>')
})
