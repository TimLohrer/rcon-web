const rconClients = {}

class RCON {
    constructor(name, serverAdress, rconPort, rconPassword) {
        this.name = name
        this.connected = false
        this.serverAdress = serverAdress
        this.rconPort = rconPort
        this.rconPassword = rconPassword
        this.ws = new WebSocket(`ws://${window.location.host}/ws`)
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

    onMessage(message) {
        message = message.data
        const args = message.split(' ')
        const packet = args[0].split('.')[1]
        message = args.slice(1).join(' ')

        if (packet == 'AUTH_REQUESTED') {
            this.auth(localStorage.getItem('serverPassword') || sessionStorage.getItem('serverPassword'))
        } else if (packet == 'AUTHORIZED') {
            this.connected = true
        } else if (packet == 'UNAUTHORIZED') {
            this.connected = false
        } else if (packet == 'RCON_ERROR_RESPONSE') {
            alert(message)
        } else if (packet == 'RCON_SUCCESS_RESPONSE') {
            alert(message)
        }

        console.log(packet, message)
    }

    onClose() {
        alert("CLOSED!")
    }
}