function closeManageOnlinePlayerGui() {
    document.getElementById('manageOnlinePlayerGui').remove();
}

function sendMessageToPlayer(playerName) {
    const message = document.getElementById('manageOnlinePlayerSendMessage').value;
    if (!message) {
        return;
    }
    rconClients[selectedServer].sendCommand(`tellraw ${playerName} {"text": "\\n\\n<RCON-Web-Dashboard> ${message}\\n\\n "}`);
}

function executeCommandAsPlayer(playerName) {
    const command = document.getElementById('manageOnlinePlayerExecuteCommandAsPlayer').value;
    if (!command) {
        return;
    }
    rconClients[selectedServer].sendCommand(`execute as ${playerName} run ${command}`);
}

function changeGamemode(playerName, gamemode) {
    rconClients[selectedServer].sendCommand(`gamemode ${gamemode} ${playerName}`);
}

function kickPlayer(playerName) {
    const reason = document.getElementById('manageOnlinePlayerKick').value;
    rconClients[selectedServer].sendCommand(`kick ${playerName} ${reason ?? '[RCON-Web-Dashboard]: Kicked by an Operator.'}`);
}

function banPlayer(playerName) {
    const reason = document.getElementById('manageOnlinePlayerBan').value;
    rconClients[selectedServer].sendCommand(`ban ${playerName} ${reason ?? '[RCON-Web-Dashboard]: Banned by an Operator.'}`);
}