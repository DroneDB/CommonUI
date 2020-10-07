module.exports = {
    basename: function(path){
        return path.split(/[\\/]/).pop();
    }
}