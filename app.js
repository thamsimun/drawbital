function writeUserData(t,e){firebase.database().ref("users/"+t).set({logInPass:e})}function writeSaveData(t,e,i){firebase.database().ref("users/"+t+"/saves/"+e).set({data:i})}function getSaveNameList(t,e){firebase.database().ref("users/"+t+"/saves/").once("value").then(function(t){var i=t.val(),s=[];for(var o in i)s.push(o);e.saves=s})}function loadaveData(t,e){firebase.database().ref("users/"+t+"/saves/"+e).once("value").then(function(t){var e=t.val().data,i=[];for(var s in e){var o=new Action(e[s].id,e[s].points,e[s].tool,e[s].colour,e[s].size,e[s].text);o.deleted=e[s].deleted,i.push(o)}return i})}function isAlphanumeric(t){return!/[^a-zA-Z0-9]/.test(t)}function playAudio(t,e){if(e instanceof Room)for(var i=0;i<e.clients.length;i++)SOCKET_LIST[e.clients[i].id].emit("playAudio",{track:t});e instanceof Client&&SOCKET_LIST[e.id].emit("playAudio",{track:t})}function stopAudio(t,e){if(e instanceof Room)for(var i=0;i<e.clients.length;i++)SOCKET_LIST[e.clients[i].id].emit("stopAudio",{track:t});e instanceof Client&&SOCKET_LIST[e.id].emit("stopAudio",{track:t})}function getWords(){var t=require("fs");t.readFile("./words-hard.txt",function(e){var e=t.readFileSync("./words-hard.txt").toString("utf-8");gameWords.hard=e.split("\n")})}function processMsg(t){for(var e;-1!=(e=t.search("<"));)t=t.substring(0,e)+"&lt;"+t.substring(e+1,t.length);return t}function emitToChat(t,e){if(t instanceof Room)for(var i in t.clientList)SOCKET_LIST[i].emit("addToChat",e);t instanceof Client&&SOCKET_LIST[t.id].emit("addToChat",e)}function refreshUserList(t,e){var i=[];if("game"!==t.mode)i=t.chatUsers;else for(var s in t.clientList)i.push({name:t.clientList[s].name,score:t.clientList[s].points});for(var s in t.clientList)SOCKET_LIST[s].emit("refreshUserList",i),"empty"!=e&&SOCKET_LIST[s].emit("addToChat",e)}var express=require("express"),app=express(),server=require("http").createServer(app),io=require("socket.io")(server),firebase=require("firebase"),SOCKET_LIST={},USER_TRACKER={},MIN_FONT_SIZE=15,MINUTES_UNTIL_PERMANENT=1,ROOM_DELETE_TIME=1800,DEBUG=!1,GAME_TIME_LIMIT=60,GAME_MAX_POINTS=10,GAME_MIN_POINTS=5,GAME_TRANSITION_TIME=10,GAME_RUSH_TIME=20,GAME_HINT_PENALTY=2,timeThen=0,gameWords={hard:[]},config={apiKey:process.env.FIREBASE_API_KEY,authDomain:"drawer-e233e.firebaseapp.com",databaseURL:"https://drawer-e233e.firebaseio.com",projectId:"drawer-e233e",storageBucket:"drawer-e233e.appspot.com",messagingSenderId:"624328057648"};firebase.initializeApp(config);var loadSaveData=function(t,e,i){setTimeout(function(){firebase.database().ref("users/"+t+"/saves/"+e).once("value").then(function(t){var e=t.val().data,s=[];for(var o in e){var r=new Action(e[o].id,e[o].points,e[o].tool,e[o].colour,e[o].size,e[o].text);r.deleted=e[o].deleted,s.push(r)}i(s)})},10)},isValidPassword=function(t,e){setTimeout(function(){return firebase.database().ref("/users/"+t.username).once("value").then(function(i){e(null!==i.val()&&i.val().logInPass==t.password)})},10)},isUsernameTaken=function(t,e){setTimeout(function(){return firebase.database().ref("/users/"+t.username).once("value").then(function(t){e(null!==t.val())})},10)},addUser=function(t,e){setTimeout(function(){writeUserData(t.username,t.password),e()},10)},isLoggedIn=function(t){return USER_TRACKER[t.username]};app.use(express.static("public")),app.get("/",function(t,e){e.sendFile(__dirname+"/client/index.html")}),app.use("/client",express.static(__dirname+"/client")),server.listen(process.env.PORT||2e3),console.log("Server started"),io.sockets.on("connection",function(t){var e=!1;console.log("socket connection"),SOCKET_LIST[t.id]=t,t.on("signIn",function(i,s){isValidPassword(i,function(o){if(o){if(isLoggedIn(i))return void s({loggedIn:!0});e=!0,Client.onConnect(t,i.username),s({success:!0})}else s({success:!1})})}),t.on("signUp",function(t,e){isUsernameTaken(t,function(i){i?e({success:!1}):addUser(t,function(){e({success:!0})})})}),t.on("disconnect",function(){console.log("socket disconnected"),delete SOCKET_LIST[t.id],e&&Client.onDisconnect(t)})});class Game{constructor(t,e){this.room=t,this.timer=GAME_TIME_LIMIT,this.curDrawerIdx=-1,this.curDrawer=this.room.clients[0],this.category="hard",this.then=0,this.started=!1,this.roundTransition=!1,this.word="",this.pointsAwarded=GAME_MAX_POINTS,this.drawerPointsCounter=0,this.isGameOver=!1,this.hintLevel=0,this.hint="",this.roundNum=1,this.roundsPerGame=e,this.numGuessers=this.room.clients.length-1}update(){refreshUserList(this.room,"empty"),this.started&&this.room.clients.length<=1?(this.started=!1,emitToChat(this.room,'<p class="text-warning">Game stopped</p>')):!this.started&&this.room.clients.length>=2&&(this.started=!0,this.then=Date.now(),this.nextRound()),this.roundTransition&&this.started?this.timer>0?this.updateTimer():this.isGameOver?this.reset():this.nextRound():this.started&&(this.curDrawer&&this.timer>0?this.updateTimer():this.roundOver())}updateTimer(){this.timer-=(Date.now()-this.then)/1e3,this.then=Date.now(),this.timer>8.1&&this.timer<=10&&!this.isGameOver&&!this.roundTransition&&playAudio("clock",this.room);for(var t=0;t<this.room.clients.length;t++)SOCKET_LIST[this.room.clients[t].id].emit("gameTimer",{timer:this.timer})}resetHint(){this.hint="",this.hintLevel=0;for(var t=0;t<this.room.clients.length;t++)SOCKET_LIST[this.room.clients[t].id].emit("gameHint",{hint:this.hint})}showHint(t){if(this.started&&this.curDrawer.id==t){switch(this.hintLevel){case 0:for(var e="",i=0;i<this.word.length;i++){var s=this.word.substr(i,1);e+=s=" "!=s?"_ ":"&emsp;"}this.hint=e,this.curDrawer.points-=GAME_HINT_PENALTY,this.hintLevel++}for(i=0;i<this.room.clients.length;i++)SOCKET_LIST[this.room.clients[i].id].emit("gameHint",{hint:this.hint})}}skip(t){t==this.curDrawer&&this.roundOver()}roundOver(){stopAudio("clock",this.room),playAudio("ding",this.room),this.roundTransition=!0,this.curDrawer.canDraw=!1,emitToChat(this.room,"Round over!"),emitToChat(this.room,"The answer was: "+this.word),this.resetHint(),++this.roundNum>this.roundsPerGame?this.gameOver():this.timer=GAME_TRANSITION_TIME}gameOver(){for(var t=this.room.clients[0],e=1;e<this.room.clients.length;e++)this.room.clients[e].points>t.points&&(t=this.room.clients[e]);emitToChat(this.room,'<p class="text-danger">'+t.name+" has won the game!</p>"),emitToChat(this.room,'<p class="text-danger">Game restarting in 15 seconds...</p>'),playAudio("win",this.room),this.roundTransition=!0,this.timer=15,this.isGameOver=!0}nextRound(){this.roundTransition=!1,this.room.surface.clearSurface(),this.numGuessers=this.room.clients.length-1;do{this.curDrawerIdx=(this.curDrawerIdx+1)%this.room.clients.length}while(!this.room.clients[this.curDrawerIdx]&&this.room.clients.length>0);this.curDrawer=this.room.clients[this.curDrawerIdx],this.curDrawer.canDraw=!0;for(var t=0;t<this.room.clients.length;t++)this.room.clients[t].solved=!1;this.word=this.getRandomWord(),emitToChat(this.curDrawer,'<p class="text-danger"> It\'s your turn to draw! Your word is <strong>'+this.word+"</strong></p>"),SOCKET_LIST[this.curDrawer.id].emit("gameWord",{value:this.word}),this.timer=GAME_TIME_LIMIT,this.pointsAwarded=GAME_MAX_POINTS,this.drawerPointsCounter=0,playAudio("newDrawer",this.curDrawer),playAudio("newRound",this.room)}getRandomWord(){return gameWords[this.category][Math.floor(Math.random()*gameWords[this.category].length)].trim().toLowerCase()}reset(){this.isGameOver=!1,this.roundNum=1,this.resetHint();for(var t=0;t<this.room.clients.length;t++)this.room.clients[t].points=0;this.nextRound()}checkAnswer(t,e){if(e=e.toLowerCase().trim(),!isAlphanumeric(e))return!1;var i=e==this.word;if(this.roundTransition||t.solved||!i){if(!this.roundTransition&&!t.solved&&this.checkCloseness(e))return emitToChat(t,`<i class="text-warning">${e} is close.</i>`),!0}else playAudio("answerFound",this.room),emitToChat(this.room,'<p class="text-success">'+t.name+" got the correct answer!</p>"),emitToChat(t,'<p class="text-success">You earned '+this.pointsAwarded+" points.</p>"),0==this.drawerPointsCounter?this.curDrawer.points+=GAME_MAX_POINTS:this.drawerPointsCounter<=5&&this.curDrawer.points++,this.drawerPointsCounter++,t.solved=!0,t.points+=this.pointsAwarded,--this.numGuessers<=0&&this.roundOver(),this.pointsAwarded>GAME_MIN_POINTS&&this.pointsAwarded--,this.timer>GAME_RUSH_TIME&&(this.timer=GAME_RUSH_TIME);return i}checkCloseness(t){for(var e=t.length-1;e>2;e--){if(0==this.word.search(t))return!0;t=t.substr(0,t.length-1)}return!1}}getWords();class Room{constructor(t,e,i,s,o){return this.name=t,this.maxUsers=e,this.password=i,this.creatorId=s,this.clientList={},this.clients=[],this.mode=o||"draw",this.game=void 0,this.chatText=[],this.chatUsers=[],this.surface=new Surface(this),this.timer=0,this.isDefaultRoom=!1,Room.list.push(this),this}updateTimer(){this.isDefaultRoom||(0==this.clients.length?this.timer++:this.timer=0,this.timer>=ROOM_DELETE_TIME&&Room.deleteRoom(this))}static deleteRoom(t){for(var e=0;e<Room.list.length;e++)if(Room.list[e]==t)return void Room.list.splice(e,1)}getGameData(){return{timer:this.timer,curDrawer:this.curDrawer}}addClient(t){t.joinRoom(this),this.clientList[t.id]=t,this.clients.push(t),this.surface.onClientJoin(t),"draw"==this.mode?t.canDraw=!0:t.canDraw=!1,SOCKET_LIST[t.id].emit("joinStatus",{value:!0,roomMode:this.mode}),SOCKET_LIST[t.id].emit("drawServerData",this.surface.getServerData())}removeClient(t){for(var e=0;e<this.clients.length;e++)this.clients[e]==t&&this.clients.splice(e,1);delete this.clientList[t.id],this.surface.onClientLeave(t)}static updateRoomList(){for(var t=[],e=0;e<Room.list.length;e++)t[e]={roomName:Room.list[e].name,numUsers:Object.keys(Room.list[e].clientList).length,isPrivate:!!Room.list[e].password,maxUsers:Room.list[e].maxUsers,mode:Room.list[e].mode};return t}static update(){for(var t,e=0;e<Room.list.length;e++)(t=Room.list[e]).updateTimer(),t.game&&t.game.update()}addChatMsg(t,e){e=processMsg(e),this.chatText.push({message:e,userName:t.name}),this.game&&t!=this.game.curDrawer&&this.game.checkAnswer(t,e)||emitToChat(this,"<strong>"+t.name+"</strong>: "+e)}static roomNameExists(t){for(var e=0;e<Room.list.length;e++)if(Room.list[e].name==t)return!0;return!1}}Room.list=[];class Surface{constructor(t){this.room=t,this.clientColours={},this.clientSizes={},this.actionList=[],this.actionMap={},this.deletedActionMap={},this.publicPathMap={},this.permanentActionList=[]}onClientJoin(t){this.clientColours[t.id]=[],this.clientSizes[t.id]=[],this.actionMap[t.id]=[],this.deletedActionMap[t.id]=[],this.publicPathMap[t.id]=[],SOCKET_LIST[t.id].emit("drawPermData",this.getPermData())}onClientLeave(t){delete this.clientColours[t.id],delete this.clientSizes[t.id],delete this.actionMap[t.id],delete this.deletedActionMap[t.id],delete this.publicPathMap[t.id]}makePermanent(){for(t=0;t<this.actionList.length;t++)this.actionList[t].deleted||this.permanentActionList.push(this.actionList[t]);this.actionList.splice(0);for(var t in this.actionMap)this.actionMap[t]=[],this.deletedActionMap[t]=[];this.refresh(!0)}copyPathToServer(t){this.addAction(t.id,this.publicPathMap[t.id],t.curTool,t.colour,t.size),this.publicPathMap[t.id]=[],this.refresh(!1)}addAction(t,e,i,s,o,r){var n=new Action(t,e,i,s,o,r);this.actionList.push(n),this.actionMap[t].push(this.actionList.length-1)}undo(t){if(this.actionMap[t].length>0){var e=this.actionMap[t].pop();this.actionList[e].deleted=!0,this.deletedActionMap[t].push(e),this.refresh()}}redo(t){if(this.deletedActionMap[t].length>0){var e=this.deletedActionMap[t].pop();this.actionList[e].deleted=!1,this.actionMap[t].push(e),this.refresh()}}refresh(t){if(t)for(var e in this.room.clientList)SOCKET_LIST[e].emit("drawPermData",this.getPermData()),SOCKET_LIST[e].emit("drawServerData",this.getServerData());else for(var e in this.room.clientList)SOCKET_LIST[e].emit("drawServerData",this.getServerData())}getPublicData(){return{clientColours:this.clientColours,clientSizes:this.clientSizes,publicPathMap:this.publicPathMap}}getPermData(){return{actionList:this.permanentActionList}}getServerData(){return{actionList:this.actionList}}getCursorData(){var t={},e={};for(var i in this.room.clientList)t[i]=[this.room.clientList[i].mouseX,this.room.clientList[i].mouseY],e[i]=this.room.clientList[i].name;return{position:t,name:e,colour:this.clientColours,size:this.clientSizes}}clearSurface(){this.actionList=[],this.permanentActionList=[];for(var t in this.actionMap)this.actionMap[t]=[],this.deletedActionMap[t]=[],this.publicPathMap[t]=[];for(var t in this.room.clientList)SOCKET_LIST[t].emit("clear")}getState(){for(var t=[],e=0;e<this.actionList.length;e++)this.actionList[e].deleted||t.push(this.actionList[e]);return t=t.concat(this.permanentActionList)}loadState(t){this.permanentActionList=this.permanentActionList.concat(t.slice()),this.refresh(!0)}}class Client{constructor(t){return this.name="default",this.id=t,this.paint=!1,this.mouseDown=!1,this.mouseUp=!1,this.mouseMove=!1,this.mouseX=0,this.mouseY=0,this.dragging=!1,this.idle=!0,this.colour="#000000",this.size=5,this.room=void 0,this.toolList={brush:void 0,text:void 0},this.curTool="brush",this.canDraw=!0,this.points=0,this.solved=!1,Client.list[t]=this,this.saves=[],this}joinRoom(t){this.room&&this.room.removeClient(this),this.points=0,this.room=t,this.toolList.brush=new Brush(this.room.surface,this),this.toolList.text=new Text(this.room.surface,this)}useCurTool(t){"brush"===this.curTool?this.toolList.brush.use():"text"===this.curTool&&this.toolList.text.use(t)}update(){if(this.canDraw){if(!this.room)return;this.mouseDown&&(this.idle=!1),this.mouseMove&&this.mouseDown&&!this.idle?(this.dragging=!0,this.useCurTool()):this.mouseDown&&!this.idle?(this.dragging=!0,this.useCurTool()):this.idle||(this.dragging=!1,this.idle=!0,this.useCurTool())}}newSave(t){this.saves.push(t),writeSaveData(this.name,t,this.room.surface.getState())}load(t){if(this.room.game)return!1;var e=this;return loadSaveData(this.name,t,function(t){t&&e.room.surface.loadState(t)}),!0}deleteSave(t){for(var e in this.saves)if(this.saves[e]===t)return firebase.database().ref("users/"+this.name+"/saves/"+t).remove(),void this.saves.splice(e,1)}static onConnect(socket,username){var client=new Client(socket.id);client.name=username,getSaveNameList(username,client),USER_TRACKER[username]=!0,socket.on("undo",function(){client.room.surface.undo(client.id)}),socket.on("redo",function(){client.room.surface.redo(client.id)}),socket.on("clear",function(){client.canDraw&&client.room.surface.clearSurface()}),socket.on("colour",function(t){client.colour=t.value}),socket.on("size",function(t){client.size=t.value}),socket.on("changeTool",function(t){client.curTool=t.toolName}),socket.on("drawText",function(t){client.canDraw&&client.useCurTool(t.text)}),socket.on("keyPress",function(t){"mousedown"===t.inputId&&(client.mouseDown=t.state),"mousemove"===t.inputId&&(client.mouseDown?client.mouseMove=!0:client.mouseMove=!1),"mouseleave"===t.inputId&&(client.mouseDown=t.state),"mouseup"===t.inputId&&(client.mouseUp=t.state),client.mouseX=t.x,client.mouseY=t.y}),socket.on("sendMsgToServer",function(t){client.room.addChatMsg(client,t)}),socket.on("evalServer",function(data){if(DEBUG){var res=eval(data);socket.emit("evalAnswer",res)}}),socket.on("showHint",function(t){client.room.game.showHint(t.id)}),socket.on("skip",function(){client.room.game.skip(client)}),socket.on("createRoom",function(t,e){if(Room.roomNameExists(t.roomName))e(!1);else{client.room&&(client.room.chatUsers=client.room.chatUsers.filter(function(t){return t!==client.name}),refreshUserList(client.room,'<p class="text-primary">'+client.name+" has left the room</p>"));var i=new Room(t.roomName,t.maxUsers,t.password,t.creatorId,t.mode);"game"==i.mode&&(i.game=new Game(i,t.roundsPerGame)),i.addClient(Client.list[i.creatorId]),i.chatUsers.push(Client.list[i.creatorId].name),socket.emit("connectRoom",{chatTextList:client.room.chatText}),refreshUserList(client.room,'<p class="text-primary">'+client.name+" has joined the room</p>"),e(!0)}}),socket.on("joinRoom",function(t){Room.list[t.roomNumber].password&&Room.list[t.roomNumber].password!=t.password?socket.emit("joinStatus",{value:!1}):(client.room&&(client.room.chatUsers=client.room.chatUsers.filter(function(t){return t!==client.name}),refreshUserList(client.room,'<p class="text-primary">'+client.name+" has left the room</p>")),Room.list[t.roomNumber].addClient(Client.list[t.clientId]),Room.list[t.roomNumber].chatUsers.push(Client.list[t.clientId].name),socket.emit("connectRoom",{chatTextList:client.room.chatText}),refreshUserList(client.room,'<p class="text-primary">'+client.name+" has joined the room</p>"))}),socket.on("saveState",function(t,e){for(var i=0;i<client.saves.length;i++)if(client.saves[i]==t.saveName)return void e({nameExists:!0});e({nameExists:!1}),client.newSave(t.saveName)}),socket.on("loadState",function(t,e){e(client.load(t.idx)?!0:!1)}),socket.on("getSaveList",function(){socket.emit("saveList",{saves:client.saves})}),socket.on("deleteSave",function(t){client.deleteSave(t.idx)})}static onDisconnect(t){var e=Client.list[t.id];USER_TRACKER[e.name]=!1,e.room&&(e.room.chatUsers=e.room.chatUsers.filter(function(t){return t!==e.name})),e.room&&e.room.removeClient(e),delete Client.list[t.id]}static update(t){for(var e in Client.list)Client.list[e].update()}}Client.list={};class Action{constructor(t,e,i,s,o,r=0){this.id=t,this.points=e,this.tool=i,this.colour=s,this.size=o,this.text=r,this.deleted=!1}}class Tool{constructor(t,e){return this.surface=t,this.client=e,this.type,this}}class Brush extends Tool{constructor(t,e){super(t,e),this.type="brush",this.points=[]}use(){this.addClick(),this.client.idle&&this.surface.copyPathToServer(this.client)}addClick(){var t=this.client.id;this.surface.clientColours[t]=this.client.colour,this.surface.clientSizes[t]=this.client.size,this.surface.publicPathMap[t].push([this.client.mouseX||this.surface.publicPathMap[t][this.surface.publicPathMap[t].length-1],this.client.mouseY||this.surface.publicPathMap[t][this.surface.publicPathMap[t].length-1]])}}class Text extends Tool{constructor(t,e){super(t,e),this.type="text"}use(t){t&&(this.surface.addAction(this.client.id,[[this.client.mouseX,this.client.mouseY]],"text",this.client.colour,Math.max(MIN_FONT_SIZE,this.client.size),t),this.surface.refresh())}}var defaultRoom=new Room("Welcome to Drawbital - Default room - Free draw");defaultRoom.isDefaultRoom=!0,setInterval(function(){for(var t in SOCKET_LIST)SOCKET_LIST[t].emit("updateRoomList",Room.updateRoomList())},2e3),setInterval(function(){Client.update(),Room.update()},30),setInterval(function(){for(s=0;s<Room.list.length;s++){var t=Room.list[s],e=t.surface.getPublicData();for(var i in t.clientList)SOCKET_LIST[i].emit("drawPublicData",e);e=t.surface.getCursorData();for(var i in t.clientList)SOCKET_LIST[i].emit("drawCursorData",e)}if(Date.now()-timeThen>=60*MINUTES_UNTIL_PERMANENT*1e3){for(var s=0;s<Room.list.length;s++)Room.list[s].surface.makePermanent();timeThen=Date.now()}},45);