const express = require('express')
const socket = require('socket.io')
const app = express()
const redirector = express()
const http = require('http')
const redirectorserv = http.createServer(redirector)
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


redirector.get("*", (req, res) => {
    res.redirect("https://skyx.online" + req.path)
})
redirectorserv.listen(80)
app.enable('trust proxy')
app.use(function (request, response, next) {

    if (process.env.NODE_ENV != 'development' && !request.secure) {
        return response.redirect("https://" + request.headers.host + request.url);
    }

    next();
})
app.get('/', (req, res) =>
    res.sendFile(__dirname + "/index.html"))
app.get("/login", (req, res) =>
    res.sendFile(__dirname + "/login.html"))
app.get("/favicon.ico", (req, res) =>
    res.sendFile(__dirname + "/resources/favicon.ico"))
app.get("/chats/*", (req, res) => {
    res.sendFile(__dirname + "/chat.html")
    console.log(req.path.replace("/chats/", ""))
})
app.get("/chat.js", (req, res)=>res.sendFile(__dirname + "/chat.js"))
app.get("/daypilot.js", (req, res)=>res.sendFile(__dirname + "/resources/daypilot-all.min.js"))
app.get("/index.js", (req, res) => res.sendFile(__dirname + "/index.js"))
app.get("/style.css", (req, res) =>
    res.sendFile(__dirname + "/style.css"))
app.get("/register", (req, res) => res.sendFile(__dirname + "/register.html"))
app.get("/test", (req, res) => res.sendFile(__dirname + "/test.html"))
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
                db.collection("users").updateOne(datael, {
                    $set: { "currentSocket": s.id }
                })
            }, (x) => {
            })
        })
        s.on("clearmessages", (uname, other) => {
            db.collection("users").updateOne({"userid":uname, "chats.otheruser":other}, 
            {$set: {"chats.$.messages":[]}})
            console.log("clearing messages for user "+uname +" in chat "+other)
            db.collection("users").findOne({"userid":uname}).then((data) => console.log(data))
        })
        s.on("sendmessage", (message, sender, receiver) =>{
            console.log(sender + " sends "+JSON.stringify(message)+" to "+receiver)
            db.collection("users").updateOne({"userid":receiver, "chats.otheruser":sender},{$push:{"chats.$.messages": message}})
            db.collection("users").findOne({"userid":receiver}).then(datael => {
                if(datael.currentSocket)
                    io.to(datael.currentSocket).emit("recmessage", datael)
            })
        })
        s.on("checkexists", (uname) => {
            if (uname == null) {
                io.to(s.id).emit("notexists")
                return
            }
            db.collection("users").findOne({ "userid": uname }).then(datael => {
                if (datael == null)
                    io.to(s.id).emit("notexists")
                else
                    io.to(s.id).emit("exists")
            }, reason => console.log("checking user failed, reason==" + reason))
        })
        s.on("checkadduser", (uname, thisuname) => {
            if (uname == null || uname == thisuname || uname == "") {
                io.to(s.id).emit("addusernotexists")
                return
            }
            db.collection("users").findOne({ "userid": uname }).then((datael) => {
                if (datael == null) {
                    console.log("checkadduser failed with user==null: uname==" + uname)
                    io.to(s.id).emit("addusernotexists")
                    return
                }
                let didadd = true
                io.to(s.id).emit("adduserexists", uname)
                db.collection("users").findOne({ "userid": thisuname }).then(thisel => {
                    if (!(thisel.chats.filter(el => el.otheruser == uname).length > 0)){
                        db.collection("users").updateOne(thisel, {
                            $push: {
                                "chats": {
                                    "otheruser": uname,
                                    "messages": []
                                }
                            }
                        }, (results) => console.log(results))
                        db.collection("users").findOne({"userid":thisuname}).then(de => console.log(de))
                    } else didadd = false
                }, reason => console.log(reason))
                let otherchatswithme = datael.chats.filter(el=>el.otheruser == thisuname).length
                console.log("other chats with this name:"+otherchatswithme)
                if (otherchatswithme == 0){
                    db.collection("users").updateOne(datael, {
                        $push: {
                            "chats": {
                                "otheruser": thisuname,
                                "messages": []
                            }
                        }
                    }, (results) => console.log(results))
                    console.log("other chats:"+JSON.stringify(datael.chats))
                } else didadd = false

                if(didadd)io.to(datael.currentSocket).emit("adduserexists", thisuname)


            }, (reason) => {
                console.log("database read failed, reason == " + reason)
            })
        })
        s.on("remchat", (otherid, thisid) => {
            db.collection("users").updateOne({"userid":thisid},
            { $pull: {"chats": {"otheruser":otherid}}
            },
            {multi:true})
            db.collection("users").updateOne({"userid":otherid},
            {$pull: {"chats":{"otheruser":thisid}}})
        })
        s.on("registerUser", (userel) => {
            console.log("registering user " + userel.user)
            console.log("hash==" + userel.hash)
            db.collection("users").insertOne({
                "userid": userel.user,
                "hash": userel.hash,
                "chats": [],
                "currentSocket": null
            })
        })
        s.on("validateUser", userel => {
            db.collection("users").findOne({ "userid": userel.user }).then(datael => {
                if (datael == null) {
                    console.log("user does not exist: " + userel.user)
                    io.to(s.id).emit("wrongdata")
                    return
                }
                console.log("user " + userel.user + " successfully validated")
                io.to(s.id).emit("userdata", datael)
            }, reason => {
                console.log("query failed, reason==" + reason)
            })
        })

    })
    io.on("disconnect", (socket) => {
        db.collection("users").updateOne({"currentSocket":socket},{$set:{"currentSocket":null}})
    })
})
