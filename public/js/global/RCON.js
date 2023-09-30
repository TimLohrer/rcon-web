const rconClients = {}
const INFO_COMMANDS = ['list', 'difficulty', 'seed', 'datapack list', 'banlist', 'whitelist list']

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
        this.sendMessage('RUN_RCON_COMMAND', `${this.serverAdress} ${this.rconPort} ${this.rconPassword} ${command}`)
    }

    loadData() {
        this.recivedServerInfoCommands = [];
        this.serverInfo = {
            'onlinePlayers': [],
            'maxPlayers': 0,
            'difficulty': '',
            'seed': '',
            'datapacks': [],
            'bans': [],
            'whitelist': []
        };
        INFO_COMMANDS.forEach(command => {
            this.sendCommand(command);
        });
    }

    onMessage(message) {
        message = message.data
        const args = message.split(' ')
        const packet = args[0].split('.')[1]

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
            message = args.slice(1).join(' ')
            alert(message)
        } else if (packet == 'RCON_SUCCESS_RESPONSE') {
            const command = args[1].replaceAll('.', ' ');
            message = args.slice(2).join(' ')
            if (INFO_COMMANDS.includes(command)) {
                this.recivedServerInfoCommands.push(command);
                if (command == 'list') {
                    this.serverInfo.maxPlayers = parseInt(message.split(' ')[7]);
                    let onlinePlayers = message.split(': ')[1].split(', ');
                    onlinePlayers.forEach(player => {
                        if (player) {
                            this.serverInfo.onlinePlayers.push(player);
                        }
                    });
                } else if (command == 'difficulty') {
                    this.serverInfo.difficulty = message.split(' ')[3];
                } else if (command == 'seed') {
                    this.serverInfo.seed = message.split(': [')[1].replace(']', '');
                } else if (command == 'datapack list') {
                    message.split(': ')[1].split(', ').forEach(datapack => {
                        datapack = datapack.replace('[', '').replace(']', '');
                        if (datapack.split(' ').length > 1) {
                            return;
                        }
                        this.serverInfo.datapacks.push(datapack);
                    });
                } else if (command == 'banlist') {
                    if (message.split(':').length <= 1) {
                        this.serverInfo.bans = [];
                    } else {
                        message.split('):')[1].split('.').forEach(bannedPlayer => {
                            if (bannedPlayer == ['']) {
                                return;
                            }
                            this.serverInfo.bans.push(bannedPlayer.split(' ')[0]);
                        });
                    }
                } else if (command == 'whitelist list') {
                    message.split(': ')[1].split(', ').forEach(whitelistedPlayer => {
                        this.serverInfo.whitelist.push(whitelistedPlayer);
                    });
                }
                if (INFO_COMMANDS.length == this.recivedServerInfoCommands.length) {
                    let serverInfo = '';
                    serverInfo += info_component(this.serverInfo);
                    serverInfo += whitelist_component(this.serverInfo);
                    serverInfo += bans_component(this.serverInfo);
                    serverInfo += datapacks_component(this.serverInfo);
                    document.getElementById('serverInfo').innerHTML = serverInfo;
                }
            }
        }
    }

    onClose() {
        delete rconClients[this.name];
        selectedServer = '';
        generateServerDropdown();
    }
}