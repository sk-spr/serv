const express = require('express')
const socket = require('socket.io')
const app = express()
const http = require('http')
const https = require('https')
const fs = require('fs')
var https_options = {
    key: fs.readFileSync("/etc/letsencrypt/live/skyx.online/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/skyx.online/fullchain.pem")
}
const server = https.createServer(https_options, app)
const io = socket(server)
const mongoclient = require('mongodb').MongoClient
const url = "mongodb://127.0.0.1:27017"




app.get('/', (req, res) =>
    res.sendFile(__dirname + "/index.html"))
app.get("/login", (req, res) =>
    res.sendFile(__dirname + "/login.html"))
app.get("/favicon.ico", (req, res) =>
    res.sendFile(__dirname + "/resources/favicon.ico"))
app.get("/chats/*", (req, res) => {
    console.log(req.path.replace("/chats/", ""))
})
app.get("/style.css", (req, res) =>
    res.sendFile(__dirname + "/style.css"))
app.get("/register", (req, res) => res.sendFile(__dirname + "/register.html"))
server.listen(443, () => console.log("listening on port 80"))

mongoclient.connect(url, (err, client) => {
    if (err) throw err
    var db = client.db("users")
    io.on('connect', (s) => {
        console.log("connection")
        s.on("checkuser", (data) => {
            db.collection("users").findOne({ "userid": data.user }).then((datael) => {
                if (datael == null || datael.hash != data.hash) {
                    //user does not exist
                    console.log("user does not exist")
                    io.to(s.id).emit("nouser")
                    return
                }
                console.log("user exists")
                io.to(s.id).emit("userret", datael)
            }, (x) => {
            })
        })
        s.on("checkexists", (uname) => {
            db.collection("users").findOne({ "userid": uname }).then(datael => {
                if (datael == null)
                    io.to(s.id).emit("notexists")
                else
                    io.to(s.id).emit("exists")
            }, reason => console.log("checking user failed, reason==" + reason))
        })
        s.on("registerUser", (userel) => {
            console.log("registering user " + userel.user)
            console.log("hash==" + userel.hash)
            db.collection("users").insertOne({
                "userid": userel.user,
                "hash": userel.hash,
                "chats": []
            })
        })
        s.on("validateUser", userel => {
            db.collection("users").findOne({ "userid": userel.user }).then(datael => {
                if (datael == null) {
                    console.log("user does not exist: " + userel.user)
                    io.to(s.id).emit("wrongdata")
                    return
                }
                console.log("user "+userel.user+" successfully validated")
                io.to(s.id).emit("userdata", datael)
            }, reason => {
                console.log("query failed, reason==" + reason)
            })
        })

    })
})
