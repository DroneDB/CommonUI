import XYZ from 'ol/source/XYZ';
import TileState from 'ol/TileState';
import ddb from 'ddb';

// A class capable of loading tiles
// from internet and file:// URLs via
// DDB tiling

function genTileFSLoadFunction(filePath, minZoom){
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

function genTileDDBLoadFunction(ddbUri, minZoom){
    const { registryUrl, org, ds, path } = ddb.utils.parseUri(ddbUri);
    const dataset = new ddb.Registry(registryUrl).Organization(org).Dataset(ds);
            
    return (tile, src) => {
        tile.setState(TileState.LOADING);
        const { tileCoord } = tile;
        let [ tz, tx, ty ] = tileCoord;
    
        if (minZoom !== undefined && tz < minZoom){
            // Do not load this one
            tile.setState(TileState.EMPTY);
        }else{
            tile.getImage().onload = () => {
                tile.setState(TileState.LOADED);
            };
            tile.getImage().onerror = e => {
                console.error(e);
                tile.setState(TileState.ERROR);
            };
            tile.getImage().src = dataset.tileUrl(path, tz, tx, ty);
        }
    };
}

class HybridXYZ extends XYZ{
    constructor(opt_options){
        const isFS = opt_options.url && opt_options.url.startsWith("file://");
        const isDDB = opt_options.url && ddb.utils.isDDBUri(opt_options.url);

        let minZoom = opt_options.minZoom;
        if (isFS && isDDB){
            // minZoom freezes OL. Bho... so we remove it
            delete(opt_options.minZoom);
        }

        super(opt_options);

        if (isFS){
            this.tileLoadFunction = genTileFSLoadFunction(opt_options.url, minZoom).bind(this);
        }else if (isDDB){
            this.tileLoadFunction = genTileDDBLoadFunction(opt_options.url, minZoom).bind(this);
        }
    }
};

export default HybridXYZ;