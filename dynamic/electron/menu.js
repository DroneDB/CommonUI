const { remote, ipcRenderer } = require('electron');
const {Menu, MenuItem, globalShortcut } = remote;

const contextMenuHandlers = {};
const shortcutHandlers = {};

module.exports = {
    registerContextMenu: function($el, menus = []){
        const menu = new Menu();
        menus.forEach(m => {
            if (m.accelerator && m.click){
                // TODO: comment back
                // It breaks shortcuts for VS Code...
                
                // shortcutHandlers[$el] = m.accelerator;
                // globalShortcut.register(m.accelerator, m.click);
            }
            menu.append(new MenuItem(m));
        });

        // Prevent default action of right click in chromium. Replace with our menu.
        contextMenuHandlers[$el] = (e) => {
            e.preventDefault()
            menu.popup(remote.getCurrentWindow())

            window.dispatchEvent(new Event("contextmenuopened"));
         };
        $el.addEventListener('contextmenu', contextMenuHandlers[$el], false);
    },

    unregisterContextMenu: function($el){
        if (contextMenuHandlers[$el]){
            $el.removeEventListener('contextmenu', contextMenuHandlers[$el]);
            delete contextMenuHandlers[$el];
        }
        if (shortcutHandlers[$el]){
            globalShortcut.unregister(shortcutHandlers[$el]);
            delete shortcutHandlers[$el];
        }
    },

    setMenuItem: function(id, property, value){
        ipcRenderer.send("setMenuItem", {id, property, value});
    }
}
