const express = require('express')
const socket = require('socket.io')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = socket(server)
const mongoclient = require('mongodb').MongoClient
const url  = "mongodb://127.0.0.1:27017"




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
app.get("/register", (req, res) => res.sendFile("register.html"))
server.listen(3000, () => console.log("listening on port 3000"))

mongoclient.connect(url, (err,client) =>{
    if(err) throw err
    var db = client.db("users")
    io.on('connect', (s) => {
        console.log("connection")
        s.on("checkuser", (data) =>{
            db.collection("users").findOne({"user-id":data.user}).then((datael) =>{
                if(datael == null || datael.hash != data.hash){
                    //user does not exist
                    io.to(s.id).emit("nouser")
                }
            }, (x) =>{
            })
        })
    })
})
