<template>
    <div class="file-browser">
        <TreeView :nodes="nodes" 
                @selectionChanged="handleSelectionChanged"
                @opened="handleOpen" />

        <div v-if="loading" class="loading">
            <i class="icon circle notch spin" />
        </div>
    </div>
</template>

<script>
import TreeView from './TreeView.vue';
import TreeNode from './TreeNode.vue';
import ddb from 'ddb';
import mfs from 'mfs';
import { registerContextMenu, unregisterContextMenu } from 'menu';
import pathutils from '../classes/pathutils';
import icons from '../classes/icons';

export default {
  components: {
      TreeView
  },
  data: function(){
      return {
          nodes: [],
          loading: true,
          lastSelectedNode: null,
      };
  },
  mounted: async function(){
      registerContextMenu(this.$el, [{
            label: "Open Item Location", 
            click: () => {
              if (this.lastSelectedNode !== null) ddb.shell.showItemInFolder(this.lastSelectedNode.node.path);
            }
          },{
            type: 'separator'
          }, {
            label: 'Properties', 
            click: () => {
              if (this.lastSelectedNode !== null){
                this.$emit('selectionChanged', [this.lastSelectedNode.node]);
                this.$emit("openProperties");
              }
            }
          }]);

      const getChildren = async function(){
          try{
            const entries = await ddb.info(this.path, {withHash: false, recursive: true, maxRecursionDepth: 1, stopOnError: false})
            return entries.filter(entry => {
                    return pathutils.basename(entry.path)[0] != "." // Hidden files/folders
                })
                .sort((a, b) => {
                    // Filename ascending
                    return pathutils.basename(a.path.toLowerCase()) > pathutils.basename(b.path.toLowerCase()) ? 1 : -1
                })
                .map(entry => {
                    return {
                        icon : icons.getForType(entry.type),
                        label: pathutils.basename(entry.path),
                        path: entry.path.substring("file://".length),
                        getChildren: ddb.entry.isDirectory(entry) ? getChildren : null,
                        selected: false,
                        entry
                    }
                });
        }catch(e){
            console.error(e);
            return [];
        }
      };

      const drives = await mfs.getDriveList();
      for (let i = 0; i < drives.length; i++){
          const d = drives[i];
          const entry = (await ddb.info(d, {withHash: false}))[0];
          this.nodes.push({
              icon: "hdd outline", 
              label: d,
              path: d,
              getChildren,
              selected: false,
              entry
          });
      }

      const homeDir = mfs.getHomeDirectory();
      this.nodes.push({
          icon: "home", 
          label: "Home", 
          path: homeDir,
          getChildren,
          selected: false,
          entry: (await ddb.info(homeDir, {withHash: false}))[0]
      });

      this.loading = false;
  },
  destroyed: function(){
      unregisterContextMenu(this.$el);
  },
  props: [],
  methods: {
      handleSelectionChanged: function(selectedNodes){
          console.log(selectedNodes);
          // Keep track of nodes for "Open Item Location"
          if (selectedNodes.length > 0) this.lastSelectedNode = selectedNodes[selectedNodes.length - 1];
          else this.lastSelectedNode = null;
          
          // If a folder is expanded and we select it, 
          // we select it's children instead.
          if (selectedNodes.length === 1){
              const n = selectedNodes[0];
              if (n.expanded && n.$children && n.$children.length > 0){
                  selectedNodes = n.$children;
              }
          }

          this.$emit('selectionChanged', selectedNodes.map(n => n.node));
      },
      handleOpen: function(component, sender){
          const node = component.node;

          // Open file in default program
          if (!ddb.entry.isDirectory(node.entry)){
            ddb.shell.openItem(node.path);
          }else{
              // Select children of item
              if (component.children && sender === "dblclick"){
                  this.$emit('selectionChanged', component.children);
              }
          }
      }
  }
}
</script>

<style scoped>
.file-browser{
    .loading{
        margin-left: 2px;
    }
    height: 100%;
    max-width: 100%;
    min-height: 100px;
}
</style>