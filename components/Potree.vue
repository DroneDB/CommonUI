<template>
    <div id="potree">
        <Message bindTo="error" />
        <div v-if="loading" class="loading">
            <p>3D Loading...</p> 
            <i class="icon circle notch spin" />
        </div>

        <div ref="container" class="potree-container">
        </div>
    </div>
</template>

<script>
import ddb from 'ddb';
import Message from './Message';
import { loadResources } from '../classes/lazy';

export default {
  components: {
      Message
  },
  props: ['files'],
  data: function(){
      return {
          loading: false,
          loaded: false
      };
  },
  mounted: function(){
  },
  
  methods:{
      onPanelResized: function(){
        // Redraw when map is resized (via panels)
        // this.map.updateSize();
      },
      onTabActivated: function(){
        this.$nextTick(() => {
            // this.map.updateSize();
        });
      },
      onTabActivated: async function(){
          // Load!
          if (!this.loaded){
              try{
                this.loading = true;
                // await loadResources("/potree/libs/openlayers3/ol.css");
                // await loadResources("/potree/libs/openlayers3/ol.js");

                await loadResources("/potree/build/potree/potree.css");
                await loadResources("/potree/libs/jquery-ui/jquery-ui.min.css");
                await loadResources("/potree/libs/spectrum/spectrum.css");
                await loadResources("/potree/libs/jstree/themes/mixed/style.css");
                await loadResources("/potree/libs/jquery/jquery-3.1.1.min.js");                
                await loadResources("/potree/libs/spectrum/spectrum.js");
                await loadResources("/potree/libs/jquery-ui/jquery-ui.min.js");
                await loadResources("/potree/libs/three.js/build/three.min.js");
                await loadResources("/potree/libs/three.js/extra/lines.js");
                await loadResources("/potree/libs/other/BinaryHeap.js");
                await loadResources("/potree/libs/tween/tween.min.js");
                await loadResources("/potree/libs/d3/d3.js");
                await loadResources("/potree/libs/proj4/proj4.js");
                await loadResources("/potree/libs/i18next/i18next.js");
                await loadResources("/potree/libs/jstree/jstree.js");
                await loadResources("/potree/build/potree/potree.js");
                await loadResources("/potree/libs/plasio/js/laslaz.js");

                let viewer = new Potree.Viewer(this.$refs.container);
                this.viewer = viewer;
                viewer.setEDLEnabled(true);
                viewer.setFOV(60);
                viewer.setPointBudget(1*1000*1000);
                viewer.setEDLEnabled(true);
                viewer.loadGUI(() => {
                    viewer.setLanguage('en');
                    $("#menu_tools").next().show();
                    viewer.toggleSidebar();
                });

                viewer.scene.scene.add( new THREE.AmbientLight( 0x404040, 2.0 ) ); // soft white light );
                viewer.scene.scene.add( new THREE.DirectionalLight( 0xcccccc, 0.5 ) );

                const directional = new THREE.DirectionalLight( 0xcccccc, 0.5 );
                directional.position.z = 99999999999;
                viewer.scene.scene.add( directional );

                Potree.loadPointCloud("/sample/ept.json", "Point Cloud", e => {
                    if (e.type == "loading_failed"){
                        this.error = "Could not load point cloud"; // TODO
                        return;
                    }
                    console.log(e);
                
                    let scene = viewer.scene;
                    scene.addPointCloud(e.pointcloud);
                    e.pointcloud.material.size = 1;

                    viewer.fitToScreen();
                });

                this.loaded = true;
              }catch(e){
                this.error = e.message;
              }finally{
                  this.loading = false;
              }
          }
      }
  },
  watch: {
      files: {
        deep: true,
        handler: function(newVal, oldVal){
            // Prevent multiple updates
            if (this._updatePotree){
                clearTimeout(this._updatePotree);
                this._updatePotree = null;
            }

            this._updatePotree = setTimeout(() => {
                // Do we need to redraw the features?
                // Count has changed or first or last items are different
                if (newVal.length !== oldVal.length || 
                    newVal[0] !== oldVal[0] || 
                    newVal[newVal.length - 1] !== oldVal[oldVal.length - 1]){
                //    this.reloadFileLayers();
                }else{
                    // Just update (selection change)
                }
            }, 5);
        }
      }
  }
}
</script>

<style scoped>
#potree{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .loading{
        margin: 8px;
        text-align: center;
        .circle.notch {
            height: 20px;
            width: 22px;
        }
    }
    .potree-container{
        margin-top: 1px;
        display: flex;
        width: 100%;
        height: 100%;
    }
}
</style>