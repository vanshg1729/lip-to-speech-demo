const express = require('express')
const app = express()

const port = 7000

// start the server
app.listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`)
})

// serve static files from the "public" directory
app.use(express.static('public'))

// log all incoming requests
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.get('/', (req, res) => {
    res.send(`<h1> enrollment page server is running <h1>`)
})
