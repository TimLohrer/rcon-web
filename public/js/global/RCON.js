const rconClients = {};
const INFO_COMMANDS = ['list', 'difficulty', 'seed', 'datapack list', 'banlist', 'whitelist list'];
const DEBUG_MODE = true;

class RCON {
    constructor(server) {
        this.serverJson = server
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

    sendCommand(command, isLoadDataCommand) {
        this.sendMessage('RUN_RCON_COMMAND', `${this.serverAdress} ${this.rconPort} ${this.rconPassword} ${command}`);
        if (!isLoadDataCommand) {
            this.loadData();
        }
    }

    loadData(animate) {
        this.recivedServerInfoCommands = [];
        this.animateIn = animate ?? false;
        this.serverInfo = {
            'onlinePlayers': [],
            'maxPlayers': 0,
            'difficulty': '',
            'seed': '',
            'datapacks': [],
            'bannedPlayers': 0,
            // 'bans': [],
            'whitelist': []
        };
        INFO_COMMANDS.forEach(command => {
            this.sendCommand(command, true);
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
            localStorage.setItem('selectedServer', JSON.stringify(this.serverJson));
            generateServerDropdown();
            this.loadData(true);
        } else if (packet == 'UNAUTHENTICATED') {
            this.connected = false;
        } else if (packet == 'RCON_ERROR_RESPONSE' && !DEBUG_MODE) {
            message = args.slice(1).join(' ')
            alert(message)
        } else if (packet == 'RCON_SUCCESS_RESPONSE' || (packet == 'RCON_ERROR_RESPONSE' && DEBUG_MODE)) {
            const command = args[1].replaceAll('.', ' ');
            message = args.slice(2).join(' ')
            if (INFO_COMMANDS.includes(command) || DEBUG_MODE) {
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
                    // if (message.split(':').length <= 1) {
                    //     this.serverInfo.bans = [];
                    // } else {
                    //     message.split('):')[1].split('.').forEach(bannedPlayer => {
                    //         if (bannedPlayer == ['']) {
                    //             return;
                    //         }
                    //         const ban = { 'player': bannedPlayer.split(' ')[0], 'issuer': bannedPlayer.split(': ')[0].split(' ')[4], 'reason': bannedPlayer.split(': ')[1] };
                    //         this.serverInfo.bans.push(ban);
                    //     });
                    // }
                    if (message.split(':').length > 1) {
                        this.serverInfo.bannedPlayers = parseInt(message.split(' ')[2]);
                    }
                } else if (command == 'whitelist list') {
                    if (message.split(': ').length >= 2) {
                        message.split(': ')[1].split(', ').forEach(whitelistedPlayer => {
                            this.serverInfo.whitelist.push(whitelistedPlayer);
                        });
                    }
                }
                if (INFO_COMMANDS.length == this.recivedServerInfoCommands.length || DEBUG_MODE) {
                    let serverInfo = '';

                    serverInfo += info_component(this.serverInfo);

                    let onlinePlayers = '';
                    this.serverInfo.onlinePlayers.push('DEFAULT')
                    this.serverInfo.onlinePlayers.forEach(onlinePlayer => {
                        onlinePlayer = onlinePlayer_component(onlinePlayer);
                        if (this.animateIn && this.serverInfo.onlinePlayers.indexOf(onlinePlayer) < 6) {
                            onlinePlayer = onlinePlayer.replace('class="onlinePlayer"', 'class="hidden top onlinePlayer"');
                        }
                        onlinePlayers += onlinePlayer;
                    });
                    if (this.serverInfo.onlinePlayers.length == 0) {
                        onlinePlayers += emptyOnlinePlayers_component(this.animateIn ? 'hidden top ' : '');
                    }
                    serverInfo += onlinePlayers_component(onlinePlayers);

                    let whitelistedPlayers = '';
                    this.serverInfo.whitelist.forEach(whitelistedPlayer => {
                        whitelistedPlayer = whitelistedPlayer_component(whitelistedPlayer);
                        if (this.animateIn && this.serverInfo.whitelist.indexOf(whitelistedPlayer) < 6) {
                            whitelistedPlayer = whitelistedPlayer.replace('class="whitelistedPlayer"', 'class="hidden top whitelistedPlayer"');
                        }
                        whitelistedPlayers += whitelistedPlayer;
                    });
                    if (this.serverInfo.whitelist.length == 0) {
                        whitelistedPlayers += emptyWhitelist_component(this.animateIn ? 'hidden top ' : '');
                    }
                    serverInfo += whitelist_component(whitelistedPlayers);

                    // let bannedPlayers = '';
                    // this.serverInfo.bans.forEach(ban => {
                    //     let bannedPlayer = bannedPlayer_component(ban);
                    //     if (this.animateIn && this.serverInfo.bans.indexOf(ban) < 6) {
                    //         bannedPlayer = bannedPlayer.replace('class="bannedPlayer"', 'class="hidden top bannedPlayer"');
                    //     }
                    //     bannedPlayers += bannedPlayer;
                    // });
                    // if (this.serverInfo.bans.length == 0) {
                    //     bannedPlayers += emptyBans_component(this.animateIn ? 'hidden top ' : '');
                    // }
                    // serverInfo += bans_component(bannedPlayers);

                    let datapacks = '';
                    this.serverInfo.datapacks.forEach(datapack => {
                        datapack = datapack_component(datapack);
                        if (this.animateIn && this.serverInfo.datapacks.indexOf(datapack) < 6) {
                            datapack = bannedPlayer.replace('class="datapack"', 'class="hidden top datapack"');
                        }
                        datapacks += datapack;
                    });
                    if (this.serverInfo.datapacks.length == 0) {
                        datapacks += emptyDatapacks_component(this.animateIn ? 'hidden top ' : '');
                    }
                    serverInfo += datapacks_component(datapacks);

                    if (this.animateIn) {
                        serverInfo = serverInfo.replace('class="info"', 'class="hidden left info"');
                        serverInfo = serverInfo.replace('class="onlinePlayers"', 'class="hidden left onlinePlayers"');
                        serverInfo = serverInfo.replace('class="whitelist"', 'class="hidden right whitelist"');
                        // serverInfo = serverInfo.replace('class="bans"', 'class="hidden right bans"');
                        serverInfo = serverInfo.replace('class="datapacks"', 'class="hidden right datapacks"');
                    }
                    document.getElementById('serverInfo').innerHTML = serverInfo;
                    this.animateIn = false;
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