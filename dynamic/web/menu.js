export default {
    registerContextMenu: function($el, menus = []){
        console.log("registerContextMenu");
    },

    unregisterContextMenu: function($el){
        console.log("unregisterContextMenu");
    },

    setMenuItem: function(id, property, value){
        console.log("setMenuItem");
    }
}
