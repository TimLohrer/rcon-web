setTimeout(() => {
    document.getElementById('commandInputForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const commandInput = document.getElementById('consoleCommandInput');
        const command = commandInput.value;
        if (!command) {
            return;
        }
        rconClients[selectedServer].sendCommand(command);
        commandInput.value = '';
    });
}, 1000);