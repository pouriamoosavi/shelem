var to = '';
var db, crypt, preScreen, currentScreen
window.dataLayer = window.dataLayer || [];
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.noBackExitsApp) {
    window.history.pushState({ noBackExitsApp: true }, '')
  }
})


$(document).ready(async function () {

  window.history.pushState({}, '')
  grantNotification()
  try {
    // firfox dont support this code (background sync)
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register('/sw.js')
      // var registration= await navigator.serviceWorker.ready
      // console.log(registration)
      // registration.sync.register('myFirstSync')
    }
  } catch (error) {
    console.log(error)
    
  }

  $('#action_menu_btn').click(function () {
    $('.action_menu').toggle();
  });
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    $('#file').on('change', function(evt){
      if( $('#file').val() != '' ){
        var send = confirm( evt.target.files[0].name + ' will send. Is this right?')
        if(send) {
          handleFileSelect(evt)
        }
      }
    })
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
  
  db = await openSyncDB()
  var token = await getItem('token')
  if (token) {
    ping();
    renderContact();
    showDiv('contactListDiv');
  } else {
    showDiv('login');
  }
})

function showDiv(divid) {
  preScreen=currentScreen
  currentScreen=divid
  $('.parts').hide();
  $('#' + divid).show();
}
function login() {
  $('#loginFaild').hide()
  crypt = new JSEncrypt({default_key_size: 2056})
  var data = {
    username: $('#username').val(),
    password: $('#password').val(),
    publicKey : crypt.getPublicKey(),
  };
  sendRequest('/api/v1/login', data, async function (err, res) {
    if (err) {
      alert(JSON.stringify(err))
    } else if (res) {
      if (res.code == 0) {
        try {
          await setItem("privateKey",crypt.getPrivateKey())
            await setItem('token', res.data.token)
              getMessages(res.data.token);
              showDiv('contactListDiv');
              ping()
            
      
        } catch (error) { throw error }
      } else {
        $('#loginFaild').text('Login faild.')
        $('#loginFaild').show()
      }
    } else {
      console.log(err)
      console.log(res)
      alert('!')
    }
  })
}
function signup() {
  $('#signupFaild').hide()
  var username=$('#susername').val()
  var password=$('#spassword').val()
  var cpassword=$('#cpassword').val()
  if (!username || username.length<4 || username.length>50 || !/^[a-z][a-z0-9]*$/i.test(username)){
    $('#signupFaild').text('Username Must be between 4 and 50 characters long. Can contain any letters from a to z and any numbers from 0 through 9')
    $('#signupFaild').show()
    return
  }
  if (password!=cpassword){
    $('#signupFaild').text('Your password and confirmation password do not match')
    $('#signupFaild').show()
    return
  }
  if (!password || password.length<6){
    $('#signupFaild').text('Your password must be at least 6 characters long')
    $('#signupFaild').show()
    return
  }
  var data = {
    username,
    password
  };
  sendRequest('/api/v1/signup', data, function (err, res) {
    if (err) {
      alert(JSON.stringify(err))
    } else if (res) {
      if (res.code == 0) {
        showDiv('login')  
      } else {
        $('#signupFaild').text('Signup faild. ' + res.msg)
        $('#signupFaild').show()
      }
    } else {
      console.log(err)
      alert('!')
    }
  })
}
async function getMessages(token) {
  try {
    sendRequest('/api/v1/getmessages', { token },async  function (err, res) {
      if (err) {
      } else if (res) {
        if (res.code == 0) {
          /*
          e.g: contacts: [{contactName: {msg: [{}]}}]
          */
          var contacts=await getItem('contacts');
          crypt = new JSEncrypt({default_key_size: 2056})
          if(!contacts) contacts = {}
          for (var i in res.data.messages) {
            var thisMessage = res.data.messages[i];
            var privateKey=await getItem("privateKey");
              if (!privateKey){
                alert("no privateKey")
              }
              else{
                if (thisMessage.text){
                  crypt.setKey(privateKey)
                  thisMessage.text= crypt.decrypt(thisMessage.text);
                  if (!thisMessage.text){
                    thisMessage.text="Invalid Key"
                  }else{
                    thisMessage.text=thisMessage.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                  }
                }
                const state = document.visibilityState;
                if (state!="visible"){
                  var options={
                    body:thisMessage.text,
                    icon:"/img/logo192.png",
                    vibrate: [500, 200, 200],
                    data: {
                      dateOfArrival: Date.now(),
                      primaryKey: 1
                    },
                    dir:"auto",
                    badge:"/img/apple-touch-icon.png"
                  }
                  notify(thisMessage.from,options, function(){})
                }
                if (contacts[thisMessage.from]) {
                  if (!contacts[thisMessage.from].msg) {
                    contacts[thisMessage.from].msg = [];
                  }
                } else {
                  contacts[thisMessage.from] = { msg: [] }
                }
                contacts[thisMessage.from].msg.push(thisMessage)
                contacts[thisMessage.from].lastUpdate=thisMessage.date;
                contacts[thisMessage.from].status=thisMessage.text||'file';                     
                await setItem('contacts', contacts)
                  if (res.data.messages && res.data.messages.length != 0) {
                    renderContact()
                    if (to) renderChat(to)
                  }
              }
          }
         
        } else if (res.code == 98) {
          logout()
        } else {
          console.log(" get Messsage Error")
        }
      } else {
        console.log(err)
      }
    })
  } catch (err) {
    console.log(err)
  }
}
async function renderContact(){
  var contacts =await getItem('contacts')
  var html = ''
  for (var c in contacts) {
    html = '<li> <a href="javascript: renderChat(\'' + c +
      '\');"><div class="d-flex bd-highlight"><div class="img_cont"><img src="/img/logo192.png" class="rounded-circle user_img"></div><div class="user_info"><span>' + c + 
        '</span><p>'+contacts[c].status+'</p></div></div></a></li>' + html
  }
  $('#contactList').html(html)
}
async function renderChat(username) {
  try {
    checkContact(username);
    var contacts=await getItem('contacts')
    var messages = contacts[username].msg;
    var persian = /[آ-ی]/;
    var html = '';
    var count = 0;
    var style = '';
    for (var m in messages) {
      count++;
      if (messages[m].fileid){
        messages[m].text ="Ive uploaded a file for you! Download it here: <a href='javascript: downloadFile(\""+ messages[m].from+"-"+messages[m].to+
        "/"+messages[m].fileid+"\",\""+messages[m].filename+"\")'>"+messages[m].filename+"<a>"
      }
      if (messages[m].text) messages[m].text = messages[m].text.replace(/(?:\r\n|\r|\n)/g, '<br>');
      if (messages[m].from == username) {
        html += '<div class="d-flex justify-content-start mb-4"><div class="msg_cotainer" dir="auto">' + messages[m].text + '<span class="msg_time">' + moment(messages[m].date).format('HH:mm') + '</span></div></div>'
      } else {
        html += '<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send" dir="auto">' + messages[m].text + '<span class="msg_time_send">' + moment(messages[m].date).format('HH:mm') + '</span></div></div>'
      }
    }
    $('#messagesBody').html(html);
    $('#chatRoomUsername').text(username);
    $('#chatRo0mMessageCount').text(count)
    to = username;
    showDiv('chatRoomDiv');
    document.getElementById('messagesBody').scrollTo(0, document.getElementById('messagesBody').scrollHeight);
   
  } catch (err) {
    console.log(err)
  }
}
async function checkContact(username) {
  try {
    if (username) {
      username=username.toLowerCase()
      var token=await getItem('token')
        var data={
          token,
          username
        }
        sendRequest('/api/v1/checkcontact', data, async function (err, res){
          if (res.code==0){
            var publicKey=res.data.publicKey
            var contacts=await getItem('contacts')
            if(!contacts) contacts = {};
            if (contacts[username]){
              contacts[username].publicKey=publicKey
            }
            else contacts[username] = { msg: [], publicKey:publicKey };
            await setItem('contacts', contacts)
            $('#newUserNameInput').val('')
            renderContact()
            getMessages(token)
            
          }
          else alert("not exist this user");
        })
    }
  } catch (err) {
    console.log(err)
  }
}
function ping() {
  try {
    setTimeout(async function () {
      var token = await getItem('token')
      if(token) {
        getMessages(token);
        ping();
      }
      
    }, 1000)
  } catch (err) {
    console.log(err);
  }
}
async function sendMessage() {
  try {
    crypt = new JSEncrypt({default_key_size: 2056})
    $('#sendButton').attr('disabled', true)
    var msg = $('#newMessage').val();
    if (msg){
      var token= await getItem('token')
      var contacts=await getItem("contacts")
      var toPublicKey=contacts[to].publicKey;
      if (toPublicKey){
        crypt.setKey(toPublicKey)
        msg= crypt.encrypt(msg)
        var data = {
        token, to, msg,
        }
        sendRequest('/api/v1/send', data, async function(err, res) {
          if(err) {
            $('#sendButton').attr('disabled', false)
          } else if (res) {
            if (res.code == 0) {
              contacts=await getItem('contacts')
              res.data.message.text=$('#newMessage').val();
              contacts[to].msg.push(res.data.message);
              await setItem('contacts', contacts)
              renderChat(to);
              $('#newMessage').val('');
            }
          $('#sendButton').attr('disabled', false)
          } else {
            console.log(err)
            alert('!');
          }
        })
      }
      else alert("no publicKey")
  
   
    }
  } catch (err) {
    console.log(err)
  }
}
function sendRequest(url, data, cb) {
  $.ajax({
    contentType: 'application/json',
    url,
    method: 'POST',
    data: JSON.stringify(data),
    success: function (res) {
      cb(false, res);
    },
    error: function (err) {
      cb(err, false)
    }
  })
}
function saveFile(blob, fileName) {
  const a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);

  a.href = window.URL.createObjectURL(
    blob
  );

  a.setAttribute("download", fileName);

  a.click();
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
}
async function logout() {
  await setItem('contacts', '')
  await setItem('token', '')
  window.location.reload();
 
}
function handleFileSelect(evt) {
  var f = evt.target.files[0];
  var reader = new FileReader();
  reader.onload = (async function(theFile) {
    return async function(e) {
      var token = await getItem('token')
        var base64String = e.target.result;
        var data = {
          name: f.name,
          size: f.size,
          type: f.type,
          base64String, 
          token,
          to,
        }
        sendRequest('/api/v1/sendfile', data, async function(err, res){
          if (err){
            console.log(err)
          } else{
            var contacts= await getItem('contacts')
            contacts[to].msg.push(res.data.message);
            await setItem('contacts', contacts)
            renderChat(to);
          }
        })
    }
  })(f);
  reader.onerror = function (error) {
    console.log('Error: ', error);
  };
  reader.readAsDataURL(f);
}
async function downloadFile(path,filename) {
  var token = await getItem('token')
  sendRequest('/api/v1/downloadfile', {token, path}, function(err, res){
    if(res.code == 0){
      var base64=res.data.base64String;
      var blob=dataURItoBlob(base64);
      saveFile(blob,filename)
    }
  })
}   
function dataURItoBlob(dataURI) {
var byteString;
if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
else
    byteString = unescape(dataURI.split(',')[1]);

var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
var ia = new Uint8Array(byteString.length);
for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
}

return new Blob([ia], {type:mimeString});
}
function openSyncDB() {
  return new Promise((resolve, reject) => {
    var open_request = indexedDB.open("toranj_db", 1);
    open_request.onerror = function(event) {
      reject(new Error("Error opening database."));
    };
    open_request.onsuccess = function(event) {
        resolve(event.target.result);
    };
    open_request.onupgradeneeded = function(event) {
      var db = event.target.result;
      db.createObjectStore("toranj", { keyPath: "key" });
    };
  })
}
function getItem(key) {
  return new Promise((resolve, reject) => {
    if(!db) reject(new Error("Make 'db' object first!"));

    var store = db.transaction(["toranj"], "readwrite").objectStore("toranj");
    var get_request = store.get(key);

    get_request.onerror = function(event) {
      reject(new Error("Error getting value from database."));
    }

    get_request.onsuccess = function(event) {
      var data = get_request.result;
      resolve(data && data.value);
    };
  });
}
function setItem(key, value) {
  return new Promise((resolve, reject) => {
    if(!db) reject(new Error("Make 'db' object first!"));

    var store = db.transaction(["toranj"], "readwrite").objectStore("toranj");
    var put_request = store.put({key, value});

    put_request.onerror = function(event) {
      reject(new Error("Error putting value into database."));
    }

    put_request.onsuccess = function(event) {
      resolve(true);
    };
  });
}
function grantNotification() {
  if (!("Notification" in window)) {
    console.log("This browser does not support system notifications");
  }
  else if (Notification.permission === "granted") {
    console.log("Already granted notification permission");
  }
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        console.log("Notification Permission Granted");
      }
    });
  }
}
async function notify(msg,options,cb) {
  if (!options) options={}
  if (!("Notification" in window)) {
    console.log("This browser does not support system notifications");
  }
  else if (Notification.permission === "granted") {
    var reg = await navigator.serviceWorker.getRegistration()
    reg.showNotification(msg,options);
  }
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(async function (permission) {
      if (permission === "granted") {
        var reg = await navigator.serviceWorker.getRegistration()
        reg.showNotification(msg,options);
      }
    });
  }
}