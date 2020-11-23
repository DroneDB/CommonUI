let shiftPressed = false;
let ctrlPressed = false;
let metaPressed = false;

let keyDownListeners = [];
let keyUpListeners = [];

const api = {
    onKeyDown: function(listener){
        keyDownListeners.push(listener);
    },

    onKeyUp: function(listener){
        keyUpListeners.push(listener);
    },

    offKeyDown: function(listener){
        keyDownListeners = keyDownListeners.filter(l => l !== listener);
    },

    offKeyUp: function(listener){
        keyUpListeners = keyUpListeners.filter(l => l !== listener);
    },

    isShiftPressed: function(){
        return shiftPressed;
    },

    isCtrlPressed: function(){
        return ctrlPressed;
    },

    isMetaPressed: function(){
        return metaPressed;
    },

    isModifierPressed: function(){
        return shiftPressed || ctrlPressed || metaPressed;
    },

    resetModifiers: function(){
        shiftPressed = ctrlPressed = metaPressed = false;
    },

    updateState: function(e){
        shiftPressed = e.shiftKey;
        ctrlPressed = e.ctrlKey;
        metaPressed = e.metaKey;
    }
};

window.addEventListener("keydown", e => {
    api.updateState(e);
    keyDownListeners.forEach(l => l(e));
});

window.addEventListener("keyup",  e => {
    api.updateState(e);
    keyUpListeners.forEach(l => l(e));
});

window.addEventListener("contextmenuopened", api.resetModifiers, false);

export default api;