let usercookie = getCookie("user")
        let hashcookie = getCookie("hash")
        let chatlist = document.getElementById("chatlist")
        let addbutton = document.getElementById("addbutton")
        if (usercookie == null)
            window.location.replace("/login")
        if(Notification.permission === "default" || Notification.permission === "denied")
            askForApproval()
        let socket = io()
        addbutton.addEventListener("click", async function(ev) {
            let uid = await DayPilot.Modal.prompt("enter username")
            //TODO: input sanitation
            socket.emit("checkadduser", uid.result, usercookie)
        })
        socket.on("adduserexists", (uid) => {
            console.log("adduser event uid=="+uid)
            if(!document.getElementById(uid))addChat(uid)
        })
        socket.on("addusernotexists", (uid) =>{

        })
        socket.emit("checkuser", { "user": usercookie, "hash": hashcookie })
        console.log(usercookie)
        console.log(hashcookie)
        socket.on("wrongdata", () => {
            window.location.replace("/login")
        })
        socket.on("nouser", () => window.location.replace("/login"))
        socket.on("userret", datael => {
            console.log(datael)
            for(let i = 0; i < datael.chats.length; i++){
                addChat(datael.chats[i].otheruser, datael.chats[i].messages.length)
            }
        })
        socket.on("recmessage", (datael) => {
            let chats = datael.chats.filter(el => el.messages.length > 0)
            for(let i = 0; i < chats.length; i++){
                console.log(chats[i])
                let notif = new Notification("skyx-"+chats[i].otheruser, {
                    icon:"https://skyx.online/favicon.ico",
                    body:"unread message(s) from "+chats[i].otheruser
                })
            }
        })
        function addChat(name, unread){
            console.log("unread:"+unread)
            console.log("adding "+name)
            let chatelem = document.createElement("li")
            chatelem.setAttribute("id", name)
            chatelem.setAttribute("class", "chatlist")
            let unreadtext = ""
            if(unread > 0 )
                unreadtext = "("+unread+")"
            chatelem.textContent = name + unreadtext
            let button = document.createElement("button")
            let nextbutton = document.createElement("button")
            nextbutton.textContent= ">"
            button.textContent = "remove"
            button.addEventListener("click", () => {
                socket.emit("remchat", chatelem.id, usercookie)
                button.parentNode.parentNode.removeChild(button.parentNode)
            })
            chatelem.appendChild(button)
            chatelem.appendChild(nextbutton)
            nextbutton.addEventListener("click", () => window.location.replace("/chats/"+chatelem.id))
            chatlist.appendChild(chatelem)
        }

        function getCookie(cname) {
            const cookies = Object.fromEntries(
                document.cookie.split(/; /).map(c => {
                    const [key, v] = c.split('=', 2);
                    return [key, decodeURIComponent(v)];
                }),
            );
            return cookies[cname];
        }
        function askForApproval() {
            /*
            Notification.requestPermission(permission => {
            if(permission === 'granted') {
                createNotification('notifications enabled');
            }
            });*/
        }
        function createNotification(message){
            /*let notification = new Notification('skyx.online',{
                icon:"https://skyx.online/favicon.ico",
                body:message
            })*/
            console.log("notifications (mobile and desktop seperately) todo")

        }