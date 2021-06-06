const express = require('express')
const app = express()

app.get('/', (req, res) =>{
    console.log(req.path)
    res.sendFile(__dirname + "/index.html")

})

app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/resources/favicon.ico"))
app.get("/chat/*", (req, res) => {
})
app.get("/bootstrap.css", (req, res) => res.sendFile(__dirname + "/resources/bootstrap.min.css"))
app.get("/style.css", (req, res) => res.sendFile(__dirname+"/style.css"))
app.listen(3000, ()=>console.log("listening on port 3000"))