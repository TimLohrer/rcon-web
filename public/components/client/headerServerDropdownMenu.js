let SAVED_SERVERS = []

function generateServerDropdown() {
    let savedServers = localStorage.getItem('savedServers');
    if (!savedServers) {
        document.getElementsByClassName('headerAddServerButton')[0]?.remove();
        document.getElementById('header').innerHTML += headerAddServerButton_component()
        return;
    } else {
        savedServers = JSON.parse(savedServers)
        SAVED_SERVERS = savedServers
        let ignoreSelected = false;
        document.getElementsByClassName('headerAddServerButton')[0]?.remove();
        document.getElementsByClassName('headerServerDropdownMenu')[0]?.remove();
        if (!selectedServer) {
            document.getElementById('header').innerHTML += headerServerDropdownMenu_component('Select Server')
        } else {
            ignoreSelected = true;
            document.getElementById('header').innerHTML += headerServerDropdownMenu_component(selectedServer)
        }

        savedServers.forEach(server => {
            if (server.name == selectedServer) {
                return;
            }

            const first = savedServers.indexOf(server) == 0;
            const last = savedServers.indexOf(server) >= savedServers.length - 1;

            document.getElementById('headerServerDropdownMenuElements').innerHTML += headerServerDropdownMenuElement_component(first && last ? ' single' : last ? ' last' : first ? ' first' : '', `headerServerDropdownMenuElements-${server.name}`, server.name)
        });
        document.getElementById('headerServerDropdownMenuElements').innerHTML += headerServerDropdownMenuElement_component(' spacer', '', '')
        document.getElementById('headerServerDropdownMenuElements').innerHTML += headerServerDropdownMenuElement_component(' addServer', 'headerServerDropdownMenuElements-addServer', 'Add Server')
        document.getElementById('headerServerDropdownMenuElements-addServer').onclick = openAddServerGui
    }
}

function toggleServerDropdown() {
    const dropdownElements = document.getElementById("headerServerDropdownMenuElements");
    dropdownElements.classList.remove('show');
    dropdownElements.classList.add('hidden', 'bottom');
    if (dropdownElements.style.display == "block") {
        setTimeout(() => {
            dropdownElements.style.display = "none";
        }, 500);
    } else {
        dropdownElements.style.display = "block";
        SAVED_SERVERS.forEach(server => {
            document.getElementById(`headerServerDropdownMenuElements-${server.name}`).onclick = () => selectServer(server);
        });
    }
}

window.onclick = function (event) {
    if (!event.target.matches('#headerServerDropdownButton')) {
        var dropdownElements = document.getElementById("headerServerDropdownMenuElements");
        if (dropdownElements.style.display == "block") {
            dropdownElements.classList.remove('show');
            dropdownElements.classList.add('hidden', 'bottom');
            setTimeout(() => {
                dropdownElements.style.display = "none";
            }, 500);
        }
    }
};