var roomList = document.getElementById('room-list');
var roomNameForm = document.getElementById('room-name');
var maxUsersForm = document.getElementById('max-users');
var passwordForm = document.getElementById('password');
var createBtn = document.getElementById('createBtn');
var displayDiv = document.getElementById('displayDiv');
var lobbyDiv = document.getElementById('lobbyDiv');
var drawRadio = document.getElementById('drawRadio');
var gameRadio = document.getElementById('gameRadio');
var numRounds = document.getElementById('num-rounds');
var roomData;
var joinedRoom = false;

socket.on('signInResponse', function (data) {
    if (data.success)
        loggedIn = true;
});

createBtn.onclick = function () {
    if (!roomNameForm.value.trim() || !maxUsersForm.value.trim()) {
        return;
    }
    socket.emit('createRoom', {
        roomName: roomNameForm.value.trim(),
        maxUsers: maxUsersForm.value.trim(),
        password: passwordForm.value,
        creatorId: socket.id,
        mode: (drawRadio.checked ? "draw" : "game"),
        roundsPerGame: numRounds.value
    }, data => {
        if(!data)
            showSnackBar("A room with the same name already exists", 'danger');
    });
    clearChatUser();
    return false;
}

gameRadio.onclick = function () {
    $('#num-rounds').removeAttr('disabled');
}
drawRadio.onclick = function () {
    $('#num-rounds').attr('disabled', '');
}

socket.on('updateRoomList', function (data) {
    roomData = data;
    roomList.innerHTML = "";
    for (var i = 0; i < data.length; i++) {
        $('#room-list').append(`<a id="${i}" href="#" class="list-group-item list-group-item-action"></a>`);
        $(`#${i}`).append(`${data[i].roomName} <span class="badge"><i class="fa fa-user"></i> ${data[i].numUsers}</span>`)
            .append(`${data[i].mode == "draw" ? '<i class="fa fa-paint-brush fa-lg right"></i>&emsp;' : '<i class="fa fa-gamepad fa-lg right"></i>&emsp;'}`)
            .append(`${data[i].isPrivate ? '<i class="fa fa-lock fa-lg right"></i>&emsp;</a>' : '</a>'}`);
    }
})

socket.on('joinStatus', function (data) {
    if (data.value) {
        joinedRoom = true;
        gotoDraw();
    }
    else {
        showSnackBar("Incorrect password", 'danger');
    }
})

$('#room-panel-body').on('dblclick', '.list-group-item', function () {
    var room = roomData[this.id];
    if(room.numUsers >= room.maxUsers) {
        showSnackBar("Room is full", 'danger');
        return;
    }
    var password;
    if(room.isPrivate) {
        password = prompt("Enter password", "");
    }    
    socket.emit('joinRoom', { roomNumber: this.id, clientId: socket.id, password: password });
})