let selectedServer = '';

setTimeout(() => {
    loadConfig();
}, 0);

setInterval(() => {
    if (selectedServer && rconClients[selectedServer].connected) {
        rconClients[selectedServer].loadData();
    }
}, 10 * 1000);

async function loadConfig() {
    const password = localStorage.getItem('serverPassword') || sessionStorage.getItem('serverPassword');
    const ws = new WebSocket(`ws${document.location.href.split('://')[0] == 'https' ? 's' : ''}://${window.location.host}/ws`);
    ws.onmessage = (msg) => {
        gotMessage = true;
        const packet = msg.data.split(' ')[0].split('.')[1];
        if (packet == 'AUTH_REQUESTED') {
            ws.send(`PACKET.AUTH ${password}`);
        } else if (packet == 'AUTHENTICATED') {
            ws.close();
            if (password == null) {
                localStorage.setItem('serverPassword', '');
            }
            generateServerDropdown();
            let selectedServer = localStorage.getItem('selectedServer');
            selectedServer = JSON.parse(selectedServer);
            if (selectedServer) {
                SAVED_SERVERS.forEach(server => {
                    if (server.name == selectedServer.name) {
                        selectServer(selectedServer);
                        return;
                    }
                });
            }
        } else {
            ws.close();
            document.getElementById('ROOT').innerHTML = passwordGui_component();
            return;
        }
    }
}

function selectServer(server) {
    if (selectedServer == server.name) {
        return;
    } else if (rconClients[server.name]) {
        selectedServer = server.name;
        localStorage.setItem('selectedServer', JSON.stringify(server));
        generateServerDropdown();
        rconClients[server.name].loadData(true);
    } else {
        new RCON(server);
    }
}

function openAddServerGui() {
    const gui = document.getElementById('addServerGui');
    gui.style.display = 'block';
}

function closeAddServerGui() {
    const gui = document.getElementById('addServerGui');
    gui.style.display = 'none';
}

function addServer() {
    const name = document.getElementById('addServerNameInput').value;
    const adress = document.getElementById('addServerAdressInput').value;
    const port = document.getElementById('addServerPortInput').value;
    const password = document.getElementById('addServerPasswordInput').value;
    if (name == "" || adress == "" || port == "" || password == "") {
        return;
    }
    const server = { 'name': name, 'serverAdress': adress, 'rconPort': port, 'rconPassword': password };
    if (!rconClients[name]) {
        let savedServers = localStorage.getItem('savedServers');
        if (savedServers) {
            savedServers = JSON.parse(savedServers);
            savedServers.push(server);
        } else {
            savedServers = [server];
        }
        localStorage.setItem('savedServers', JSON.stringify(savedServers));
    }
    selectServer(server);
    generateServerDropdown();
    closeAddServerGui();
}