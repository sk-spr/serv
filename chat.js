    navigator.serviceWorker.register('./sw.js');
    console.log(window.location.pathname);
    let chatname = decodeURI(window.location.pathname).replace("/chats/", "");
    let title = document.getElementById("title");
    let backbtn = document.getElementById("backbutton");
    backbtn.addEventListener("click", (e) => { window.location.replace("/") });


    let messages = [];
    let localstorage = window.localStorage.getItem("messages_" + chatname)
    console.log("localstorage:" + JSON.parse(localstorage))
    if (localstorage != null && localStorage != "null") {
      messages = JSON.parse(localstorage)
      console.log(messages)
      console.log("messages[0]:" + messages[0])
    }


    title.textContent = chatname;
    console.log("messages:" + messages);
    let windowtitle = document.getElementById("windowtitle");
    windowtitle.textContent = chatname + " - skyx chat";
    let usercookie = getCookie("user");
    let hashcookie = getCookie("hash");
    let messageform = document.getElementById("msgbox");
    let messageinput = document.getElementById("msginput");
    let socket = io();
    socket.emit("checkuser", { user: usercookie, hash: hashcookie });
    socket.on("userret", (userobj) => {
      let localstorage = window.localStorage.getItem("messages_" + chatname)
      console.log("locstor=", localstorage)
      if (localstorage != null)
        messages = JSON.parse(localstorage)
      let chatobj = userobj.chats.filter(
        (chat) => chat.otheruser == chatname
      )[0];
      console.log(typeof chatobj.messages[0]);
      let msglist = chatobj.messages;
      socket.emit("clearmessages", usercookie, chatname);
      if (msglist != null)
        for (let i = 0; i < msglist.length; i++) {
          messages.push(msglist[i]);
          console.log(JSON.stringify(messages))
        }
      console.log(messages)
      for (let i = 0; i < messages.length; i++) {
        console.log(messages[i])
      }
      console.log("stringify: ", JSON.stringify(messages))
      window.localStorage.setItem("messages_" + chatname, JSON.stringify(messages));
      readMessages();
    });
    socket.on("wrongdata", () => {
      window.location.replace("/login");
    });
    socket.on("nouser", () => window.location.replace("/login"));
    socket.on("recmessage", (datael) => {
      let newmessages = datael.chats.filter(el => el.otheruser == chatname)[0].messages
      for (let i = 0; i < newmessages.length; i++) {
        /*if(Notification.permission === "granted"){
          let truncatedMessage = newmessages[i].messagetext
          if(truncatedMessage.length > 50)
            truncatedMessage = truncatedMessage.substring(0,49)+"..."
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("skyx - ", {
            icon:"https://skyx.online/favicon.ico",
            body:truncatedMessage,
            onClick:()=>{window.open("https://skyx.online/chats/"+chatname, "_self")}
          })
          })
          let notif = ServiceWorkerRegistration.showNotification("skyx - ", {
            icon:"https://skyx.online/favicon.ico",
            body:truncatedMessage,
          })
          notif.onclick = function(){
            window.open("https://skyx.online/chats/"+chatname, "_self")
          }
        }*/
        messages.push(newmessages[i])
        console.log(newmessages[i])
        attachmessage(newmessages[i])
      }

      console.log("new messages:" + JSON.stringify(newmessages))
      window.localStorage.setItem("messages_" + chatname, JSON.stringify(messages))
      socket.emit("clearmessages", usercookie, chatname)
    })
    messageform.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messageinput.value != "") {
        console.log("sending message:" + messageinput.value);
        let newmsg = { messagetext: messageinput.value, sender: usercookie };
        attachmessage(newmsg);
        messages.push(newmsg);
        window.localStorage.setItem("messages_" + chatname, JSON.stringify(messages))
        //TODO: sanitize input
        //TODO: encrypt messages
        socket.emit("sendmessage", newmsg, usercookie, chatname);
        messageinput.value = "";
      }
    });
    function readMessages() {
      let msglist = document.getElementById("msglist");
      console.log("reading messages, messages = ", messages)
      if (messages != null) {
        for (let i = 0; i < messages.length; i++) {
          let msg = messages[i];
          attachmessage(msg);
        }
      }
    }
    function attachmessage(msg) {
      let msgelem = document.createElement("li");
      console.log("message=" + msg)
      msgelem.innerText = msg.messagetext;
      //msgelem.id = msg.msghash;
      msgelem.setAttribute("class", "othermessage");
      if (msg.sender == usercookie) msgelem.setAttribute("class", "message");
      msglist.appendChild(msgelem);
    }
    function getCookie(cname) {
      const cookies = Object.fromEntries(
        document.cookie.split(/; /).map((c) => {
          const [key, v] = c.split("=", 2);
          return [key, decodeURIComponent(v)];
        })
      );
      return cookies[cname];
    }