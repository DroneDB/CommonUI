import XYZ from 'ol/source/XYZ';
import TileState from 'ol/TileState';
import ddb from 'ddb';

// A class capable of loading tiles
// from internet and file:// URLs via
// DDB tiling

function genTileLoadFunction(filePath, minZoom){
    return (tile, src) => {
        tile.setState(TileState.LOADING);
        const { tileCoord } = tile;
        let [ tz, tx, ty ] = tileCoord;
    
        if (minZoom !== undefined && tz < minZoom){
            // Do not load this one
            tile.setState(TileState.EMPTY);
        }else{
            ddb.tile.getFromUserCache(filePath.replace(/^file:\/\//, ""), tz, tx, ty, { size: 256, tms: true}).then((tilePath) => {
                tile.getImage().src = "file://" + tilePath;
                tile.setState(TileState.LOADED);
            }).catch(e => {
                console.error(e);
                tile.setState(TileState.ERROR);
            });
        }
    };
}

class HybridXYZ extends XYZ{
    constructor(opt_options){
        const isFS = opt_options.url && opt_options.url.startsWith("file://");
        let minZoom = opt_options.minZoom;
        if (isFS){
            opt_options.tileSize = 256;

            // minZoom freezes OL. Bho... so we remove it
            delete(opt_options.minZoom);
        }
        
        super(opt_options);

        if (isFS){
            this.tileLoadFunction = genTileLoadFunction(opt_options.url, minZoom).bind(this);
        }
    }
};

export default HybridXYZ;