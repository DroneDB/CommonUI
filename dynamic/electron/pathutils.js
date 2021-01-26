const app = require('electron').remote.app;

module.exports = {
    rootPath: function(path){
        return app.getAppPath() + "/build/" + path;
    }
}