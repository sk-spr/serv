const express = require('express')
const socket = require('socket.io')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = socket(server)


app.get('/', (req, res) =>
    res.sendFile(__dirname + "/index.html"))
app.get("/login", (req, res) =>
    res.sendFile(__dirname + "/login.html"))
app.get("/favicon.ico", (req, res) =>
    res.sendFile(__dirname + "/resources/favicon.ico"))
app.get("/chat/*", (req, res) => {
})
app.get("/bootstrap.css", (req, res) =>
    res.sendFile(__dirname + "/resources/bootstrap.min.css"))
app.get("/style.css", (req, res) =>
    res.sendFile(__dirname + "/style.css"))
server.listen(3000, () => console.log("listening on port 3000"))


io.on('connect', (s) => {
    console.log("connection")
})