const shell = require('electron').remote.shell;

module.exports = {
    openItem: shell.openItem,
    showItemInFolder: shell.showItemInFolder
}