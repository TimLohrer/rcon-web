async function setupPassword() {
    const password = document.getElementById('passwordInput').value
    const savePassword = document.getElementById('savePasswordInput').checked
    if (!password) {
        return;
    }
    const ws = new WebSocket(`ws://${window.location.host}/ws`)
    ws.onmessage = (msg) => {
        gotMessage = true;
        const packet = msg.data.split(' ')[0].split('.')[1];
        if (packet == 'AUTH_REQUESTED') {
            ws.send(`PACKET.AUTH ${password}`)
        } else if (packet == 'AUTHENTICATED') {
            ws.close()
            if (savePassword == true) {
                localStorage.setItem('serverPassword', password);
            } else {
                sessionStorage.setItem('serverPassword', password)
            }
            window.open('/', '_self')
        }
    }
}