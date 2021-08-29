const { ipcRenderer } = require('electron');

module.exports = {
    setMenuItem: function(id, property, value){
        ipcRenderer.send("setMenuItem", {id, property, value});
    }
}
