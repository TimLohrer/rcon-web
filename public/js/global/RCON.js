const rconClients = {}

class RCON {
    constructor(server) {
        this.name = server.name
        this.connected = false
        this.serverAdress = server.serverAdress
        this.rconPort = server.rconPort
        this.rconPassword = server.rconPassword
        this.ws = new WebSocket(`ws${document.location.href.split('://')[0] == 'https' ? 's' : ''}://${window.location.host}/ws`)
        this.ws.onmessage = (message) => this.onMessage(message);
        this.ws.onclose = () => this.onClose();
    }

    sendMessage(packet, message) {
        this.ws.send(`PACKET.${packet} ${message}`)
    }

    auth(password) {
        this.sendMessage('AUTH', password)
    }

    sendCommand(command) {
        this.sendMessage('RUN_RCON_COMMAND', `${this.serverAdress}:${this.rconPort} ${this.rconPassword} ${command}`)
    }

    loadData() {
        return;
    }

    onMessage(message) {
        message = message.data
        const args = message.split(' ')
        const packet = args[0].split('.')[1]
        message = args.slice(1).join(' ')

        if (packet == 'AUTH_REQUESTED') {
            this.auth(localStorage.getItem('serverPassword') || sessionStorage.getItem('serverPassword'))
        } else if (packet == 'AUTHENTICATED') {
            this.connected = true;
            rconClients[this.name] = this;
            selectedServer = this.name;
            generateServerDropdown();
            this.loadData();
        } else if (packet == 'UNAUTHENTICATED') {
            this.connected = false;
        } else if (packet == 'RCON_ERROR_RESPONSE') {
            alert(message)
        } else if (packet == 'RCON_SUCCESS_RESPONSE') {
            alert(message)
        }

        console.log(packet, message)
    }

    onClose() {
        delete rconClients[this.name];
        selectedServer = '';
        generateServerDropdown();
    }
}