export function clone(obj){
    if (typeof obj === 'undefined') return undefined;
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch(e) {
        console.error(e);
        debugger;
        return undefined;
    }
}

export function bytesToSize(bytes, decimals = 2){
    if(bytes == 0) return '0 byte';
    var k = 1000; // or 1024 for binary
    var dm = decimals || 3;
    var sizes = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}