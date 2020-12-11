<template>
    <div id="map" 
        @mouseover="setMouseInside(true)" 
        @mouseleave="setMouseInside(false)">
        <Toolbar :tools="tools" ref="toolbar" />
        <div ref="map-container" class="map-container" :class="{'cursor-pointer': selectSingle,
                                         'cursor-crosshair': selectArea}"/>
    </div>
</template>

<script>
import 'ol/ol.css';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer, Group as LayerGroup} from 'ol/layer';
import {OSM, Vector as VectorSource, Cluster} from 'ol/source';
import {defaults as defaultControls, Control} from 'ol/control';
import Collection from 'ol/Collection';
import {DragBox} from 'ol/interaction';
import {createEmpty as createEmptyExtent, isEmpty as isEmptyExtent, extend as extendExtent} from 'ol/extent';
import {transformExtent} from 'ol/proj';

import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { coordEach } from '@turf/meta';
import bbox from '@turf/bbox';
import Point from 'ol/geom/Point';

import ddb from 'ddb';
import HybridXYZ from '../classes/olHybridXYZ';
import XYZ from 'ol/source/XYZ';
import Toolbar from './Toolbar.vue';
import Keyboard from '../keyboard';
import Mouse from '../mouse';

import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style';

export default {
  components: {
      Map, Toolbar
  },
  props: ['files'],
  data: function(){
      return {
        tools: [
            {
                id: 'select-features',
                title: "Select Features (CTRL)",
                icon: "hand pointer outline",
                exclusiveGroup: "select",
                onSelect: () => {
                    this.selectSingle = true;
                },
                onDeselect: () => {
                    this.selectSingle = false;
                }
            },
            {
                id: 'select-features-by-area',
                title: "Select Features by Area (CTRL+SHIFT)",
                icon: "square outline",
                exclusiveGroup: "select",
                onSelect: () => {
                    this.selectArea = true;
                    this.map.addInteraction(this.dragBox);
                },
                onDeselect: () => {
                    this.selectArea = false;
                    this.selectFeaturesByAreaKeyPressed = false;
                    this.map.removeInteraction(this.dragBox);
                }
            },
            {
                id: 'clear-selection',
                title: "Clear Selection (ESC)",
                icon: "ban",
                onClick: () => {
                    this.clearSelection();
                }
            },
            
        ],

        selectSingle: false,
        selectArea: false,
      };
  },
  mounted: function(){
    this._updateMap = null;

    const genShotStyle = (fill, stroke, size) => {
        let text = null;
        if (size > 1){
            text = new Text({
                text: size.toString(),
                font: 'bold 14px sans-serif',
                fill: new Fill({
                    color: 'rgba(252, 252, 255, 1)'
                })
            });
        }

        return new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({
                    color: fill
                }),
                stroke: new Stroke({
                    color: stroke,
                    width: 2
                })
            }),
            text
        });
    };

    this.styles = {
        'shot': feats => {
            let styleId = `_shot-${feats.length}`;
            let selected = false;
            for (let i = 0; i < feats.length; i++){
                if (feats[i].file && feats[i].file.selected){
                    styleId = `_shot-selected-${feats.length}`;
                    selected = true;
                    break;
                }
            }
            
            // Memoize
            if (!this.styles[styleId]){
                if (selected) this.styles[styleId] = genShotStyle('rgba(255, 158, 103, 1)', 'rgba(252, 252, 255, 1)', feats.length);
                else this.styles[styleId] = genShotStyle('rgba(75, 150, 243, 1)', 'rgba(252, 252, 255, 1)', feats.length);
            }

            return this.styles[styleId];
        }
    };

    this.fileFeatures = new VectorSource();
    const clusterSource = new Cluster({
        distance: 0.0001,
        source: this.fileFeatures
    });
    this.fileLayer = new VectorLayer({
        source: clusterSource,
        style: cluster => {
            const feats = cluster.get('features');
            const s = this.styles[feats[0].style];
            if (typeof s === "function") return s(feats);
            else return s;
        }
    });
    this.rasterLayers = new LayerGroup();


    this.dragBox = new DragBox({minArea: 0});
    this.dragBox.on('boxend', () => {
        let extent = this.dragBox.getGeometry().getExtent();

        // Select (default) or deselect (if all features are previously selected)
        const intersect = [];
        this.fileFeatures.forEachFeatureIntersectingExtent(extent, feat => {
            intersect.push(feat);
        });

        let deselect = false;
        
        // Clear previous
        if (!Keyboard.isShiftPressed()){
            this.clearSelection();
        }else{
            deselect = intersect.length > 0 && intersect.filter(feat => feat.file.selected).length === intersect.length;
        }
        
        if (deselect){
            intersect.forEach(feat => feat.file.selected = false);
        }else{
            intersect.forEach(feat => feat.file.selected = true);
        }
    });

    this.map = new Map({
        target: this.$refs['map-container'],
        layers: [
            new TileLayer({
                source: new OSM()
            }),
            this.rasterLayers,
            this.fileLayer,
        ],
        view: new View({
            center: [0, 0],
            zoom: 2
        })
    });

    const doSelectSingle = e => {
        this.map.forEachFeatureAtPixel(e.pixel, cluster => {
            const feats = cluster.get('features');
            let selected = false;
            for (let i = 0; i < feats.length; i++){
                if (feats[i].file && feats[i].file.selected){
                    selected = true;
                    break;
                }
            }
            for (let i = 0; i < feats.length; i++){
                if (feats[i].file) feats[i].file.selected = !selected;
            }
        });
    };

    this.map.on('click', e => {
        // Single selection
        //if (this.selectSingle){
            doSelectSingle(e);
        //}
    });

    // Right click
    this.map.on('contextmenu', e => {
        // Single selection
        doSelectSingle(e);
    });

    Keyboard.onKeyDown(this.handleKeyDown);
    Keyboard.onKeyUp(this.handleKeyUp);

    // Redraw, otherwise openlayers does not draw
    // the map correctly
    setTimeout(() => this.map.updateSize(), 1);

    // Redraw when map is resized (via panels)
    this.$el.addEventListener('resized', () => {
        this.map.updateSize();
    });
  },
  beforeDestroy: function(){
    Keyboard.offKeyDown(this.handleKeyDown);
    Keyboard.offKeyUp(this.handleKeyUp);
  },
  watch: {
      files: {
        deep: true,
        handler: function(newVal, oldVal){
            // Prevent multiple updates
            if (this._updateMap){
                clearTimeout(this._updateMap);
                this._updateMap = null;
            }

            this._updateMap = setTimeout(() => {

                // Do we need to redraw the features?
                // Count has changed or first or last items are different
                if (newVal.length !== oldVal.length || 
                    newVal[0] !== oldVal[0] || 
                    newVal[newVal.length - 1] !== oldVal[oldVal.length - 1]){
                   this.reloadFileLayers();
                }else{
                    // Just update (selection change)
                    this.fileLayer.changed();
                }
            }, 5);
        }
      }
  },
  methods: {
      getSelectedFilesExtent: function(){
          const ext = createEmptyExtent();
          if (this.fileFeatures.getFeatures().length){
            extendExtent(ext, this.fileFeatures.getExtent());
          }
          if (this.rasterLayers.getLayers().length){
            extendExtent(ext, this.rasterLayers.getExtent());
          }
          return ext;
      },
      clearLayerGroup: function(layerGroup){
        for (var j = 0; j < layerGroup.getLayers().getLength(); j++) {
            let layer = layerGroup.getLayers().pop();
            layer = {};
        }
      },
      setMouseInside: function(flag){
          this.mouseInside = flag;
      },
      reloadFileLayers: function(){
        this.fileFeatures.clear();
        this.clearLayerGroup(this.rasterLayers);

        const features = [];
        const rasters = this.rasterLayers.getLayers();

        // Create features, add them to map
        this.files.forEach(f => {
            if (!f.entry) return;

            if (f.entry.type === ddb.entry.type.GEOIMAGE){
                coordEach(f.entry.point_geom, (coord) => {
                    const feat = new Feature(new Point(coord));
                    feat.style = 'shot';
                    feat.file = f;
                    feat.getGeometry().transform('EPSG:4326', 'EPSG:3857');
                    features.push(feat);
                });
            }else if (f.entry.type === ddb.entry.type.GEORASTER){
                const extent = transformExtent(bbox(f.entry.polygon_geom), 'EPSG:4326', 'EPSG:3857');
                
                rasters.push(new TileLayer({
                    extent, 
                    source: new HybridXYZ({
                        url: f.entry.path,
                        tileSize: 512,
                        minZoom: 14,
                        maxZoom: 22
                        // TODO: get min/max zoom from file
                    })
                }));
            }
        });

        if (features.length) this.fileFeatures.addFeatures(features);

        const ext = this.getSelectedFilesExtent();
        if (!isEmptyExtent(ext)){
            // Zoom to it
            setTimeout(() => {
                this.map.getView().fit(ext, { 
                    padding: [40, 40, 40, 40], 
                    duration: 500,
                    minResolution: 0.5
                });
            }, 10);
        }
      },
      handleKeyDown: function(){
        if (Keyboard.isCtrlPressed() && this.mouseInside){
            if (Keyboard.isShiftPressed()){
                this.selectFeaturesByAreaKeyPressed = true;
                this.$refs.toolbar.selectTool('select-features-by-area');
            }else{
                this.$refs.toolbar.selectTool('select-features');
            }
        }
      },
      handleKeyUp: function(e){
        // ESC
        if (e.keyCode === 27){
            this.$refs.toolbar.selectTool('clear-selection');
            this.$refs.toolbar.deselectAll();
        }

        if (!Keyboard.isCtrlPressed() && this.mouseInside){
            if (!Keyboard.isShiftPressed() && this.selectFeaturesByAreaKeyPressed){
                this.$refs.toolbar.deselectTool('select-features-by-area');
            }
            this.$refs.toolbar.deselectTool('select-features');
        }
      },
      clearSelection: function(){
          this.files.forEach(f => f.selected = false);
      }
  }
}
</script>

<style scoped>
#map{
    border-top: 1px solid #030A03;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.map-container{
    width: 100%;
    height: 100%;

    &.cursor-pointer{
        cursor: pointer;
    }
    &.cursor-crosshair{
        cursor: crosshair;
    }
}
</style>