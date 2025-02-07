function closeManageOnlinePlayerGui() {
    document.getElementById('manageOnlinePlayerGui').remove();
}

function sendMessageToPlayer(playerName) {
    const input = document.getElementById('manageOnlinePlayerSendMessage');
    const message = input.value;
    if (!message) {
        return;
    }
    input.value = '';
    rconClients[selectedServer].sendCommand(`tellraw ${playerName} {"text": "\\n\\n<RCON-Web-Dashboard> ${message}\\n\\n "}`);
}

function executeCommandAsPlayer(playerName) {
    const input = document.getElementById('manageOnlinePlayerExecuteCommandAsPlayer');
    let command = input.value;
    if (!command) {
        return;
    }
    input.value = '';
    rconClients[selectedServer].sendCommand(`execute as ${playerName} run ${command}`);
}

function teleportPlayer(playerName) {
    const xInput = document.getElementById('manageOnlinePlayerTeleportPlayerX');
    const yInput = document.getElementById('manageOnlinePlayerTeleportPlayerY');
    const zInput = document.getElementById('manageOnlinePlayerTeleportPlayerZ');
    let x = xInput.value;
    let y = yInput.value;
    let z = zInput.value;
    if (x == '' || y == '' || z == '') {
        return;
    }
    xInput.value = '';
    yInput.value = '';
    zInput.value = '';
    rconClients[selectedServer].sendCommand(`execute at ${playerName} run tp ${playerName} ${x} ${y} ${z}`);
}

function changeGamemode(playerName, gamemode) {
    rconClients[selectedServer].sendCommand(`gamemode ${gamemode} ${playerName}`);
}

function kickPlayer(playerName) {
    const input = document.getElementById('manageOnlinePlayerKick');
    const reason = input.value;
    input.value = '';
    rconClients[selectedServer].sendCommand(`kick ${playerName} ${`[RCON-Web-Dashboard] ${reason}` ?? '[RCON-Web-Dashboard]: Kicked by an Operator.'}`);
}

function banPlayer(playerName) {
    const input = document.getElementById('manageOnlinePlayerBan');
    const reason = input.value;
    input.value = '';
    rconClients[selectedServer].sendCommand(`ban ${playerName} ${`[RCON-Web-Dashboard] ${reason}` ?? '[RCON-Web-Dashboard]: Banned by an Operator.'}`);
}