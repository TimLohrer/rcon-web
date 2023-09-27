setTimeout(() => {
    loadConfig()
}, 0)

async function loadConfig() {
    let password = localStorage.getItem('serverPassword')
    if (password == null) {
        password = sessionStorage.getItem('serverPassword');
    }
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
        } else {
            ws.close()
            document.getElementById('ROOT').innerHTML = passwordGui_component()
            return;
        }
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
    const name = document.getElementById('addServerNameInput').value
    const adress = document.getElementById('addServerAdressInput').value
    const port = document.getElementById('addServerPortInput').value
    const password = document.getElementById('addServerPasswordInput').value
    if (name == "" || adress == "" || port == "" || password == "") {
        return;
    }
    const rcon = new RCON(name, adress, port, password)
    rconClients[name] = rcon
    closeAddServerGui()
}