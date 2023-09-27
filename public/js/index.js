let selectedServer = '';

setTimeout(() => {
    loadConfig()
}, 0)

async function loadConfig() {
    const password = localStorage.getItem('serverPassword') || sessionStorage.getItem('serverPassword');
    const ws = new WebSocket(`ws://${window.location.host}/ws`)
    ws.onmessage = (msg) => {
        gotMessage = true;
        const packet = msg.data.split(' ')[0].split('.')[1];
        if (packet == 'AUTH_REQUESTED') {
            ws.send(`PACKET.AUTH ${password}`)
        } else if (packet == 'AUTHENTICATED') {
            ws.close()
            if (password == null) {
                localStorage.setItem('serverPassword', '')
            }
            generateServerDropdown()
        } else {
            ws.close()
            document.getElementById('ROOT').innerHTML = passwordGui_component()
            return;
        }
    }
}

function selectServer(server) {
    alert(server.name)
}

function addClientEventByClass(className, event) {
    document.getElementsByClassName(className)[0].onclick = () => event
}

function addClientEventById(id, event) {
    document.getElementById(id).onclick = () => event()
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
    const name = document.getElementById('addServerNameInput').value
    const adress = document.getElementById('addServerAdressInput').value
    const port = document.getElementById('addServerPortInput').value
    const password = document.getElementById('addServerPasswordInput').value
    if (name == "" || adress == "" || port == "" || password == "") {
        return;
    }
    if (true) {
        let savedServers = localStorage.getItem('savedServers');
        const server = { 'name': name, 'serverAdress': adress, 'rconPort': port, 'rconPassword': password };
        if (savedServers) {
            savedServers = JSON.parse(savedServers)
            savedServers.push(server)
        } else {
            savedServers = [server];
        }
        localStorage.setItem('savedServers', JSON.stringify(savedServers));
    }
    generateServerDropdown()
    closeAddServerGui()
}