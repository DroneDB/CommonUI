module.exports = {
    basename: function(path){
        return path.split(/[\\/]/).pop();
    },

    join: function(...paths){
        return paths.map(p => {
            if (p[p.length - 1] === "/") return p.slice(0, p.length - 1);
            else return p;
        }).join("/");
    }
}