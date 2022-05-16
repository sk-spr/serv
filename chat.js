//navigator.ServiceWorkerContainer.register('./sw.js');
console.log("mobile = " +mobileCheck())
console.log(window.location.pathname);
let chatname = decodeURI(window.location.pathname).replace("/chats/", "");
let title = document.getElementById("title");
let backbtn = document.getElementById("backbutton");
backbtn.addEventListener("click", (e) => { window.location.replace("/") });
let dont_ask_notif = false


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
    if("Notification" in window && Notification.permission == "granted"){//if(!mobileCheck()){
        var notification = new Notification("skyx - new message(s)", {
        icon:"https://skyx.online/favicon.ico",
        body:truncateMessage(newmessages[i].messagetext, 50),
        onclick:() => window.open("https://skyx.online/chats/"+chatname, "_self")
        })
       }
   else if(Notification.permission == "denied" || Notification.permission == "default")
      Notification.requestPermission().then((perm) => {if(perm == "denied") dont_ask_notif = true})
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
function mobileCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function truncateMessage(message, maxlength){
  let targetLength = maxlength - 3
  console.log(targetLength - message.length)
  if(message.length > targetLength)
    return message.substring(0, targetLength - 1) + "..."
  else return message
}