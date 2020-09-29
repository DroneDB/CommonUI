import { entry } from 'ddb';

const typeIconMap = {
    [entry.type.DIRECTORY]: "folder outline",
    [entry.type.GENERIC]: "file outline",
    [entry.type.GEOIMAGE]: "crosshairs",
    [entry.type.GEORASTER]: "map outline",
    [entry.type.POINTCLOUD]: "braille",
    [entry.type.IMAGE]: "file image outline",
    [entry.type.DRONEDB]: "database",
};

export default {
    getForType: function(entryType){
        return typeIconMap[entryType] || "question";
    }
}