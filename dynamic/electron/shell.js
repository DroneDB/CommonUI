const shell = require('electron').remote.shell;

module.exports = {
    openItem: shell.openItem,
    showItemInFolder: uri => {
        shell.showItemInFolder(uri.replace(/^file:\/\//, ""));
    }
}