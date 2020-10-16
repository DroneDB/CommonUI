module.exports = {
    registerContextMenu: function($el, menus = []){ return window.__menu.registerContextMenu(...arguments) },
    unregisterContextMenu: function($el){ return window.__menu.unregisterContextMenu(...arguments) },
    setMenuItem: function(id, property, value){ return window.__menu.setMenuItem(...arguments) }
};