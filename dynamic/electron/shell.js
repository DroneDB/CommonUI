const shell = require('electron').remote.shell;

module.exports = {
    openItem: shell.openItem,
    showItemInFolder: uri => {
        // On Linux you need to remove the file:// prefix
        if (process.platform !== "win32") {
            uri = uri.replace("file://", "");
        }
        shell.showItemInFolder(uri);
    }
}