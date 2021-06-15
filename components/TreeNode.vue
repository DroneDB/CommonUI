<template>
    <div class="tree-node">
        <div class="entry" 
            @click="onClick" 
            @dblclick="handleOpenDblClick" 
            @contextmenu="onRightClick"
            :class="{selected: selected}">
            <i class="icon circle notch spin" v-if="loading" />
            <i class="icon" @click="handleOpenCaret"
                            :class="expanded ? 'caret down' : 'caret right'" 
                            v-if="node.isExpandable && !loading && !empty" />
            <i class="icon nonexistant" v-if="!node.isExpandable || empty" />

            <i class="icon" :class="node.icon" />
            <div class="text">{{ node.label }}</div>
        </div>
        <div class="children" v-if="expanded">
            <TreeNode v-for="(node, index) in children" 
                    :node="node"
                    :key="node.path" 
                    ref="nodes"
                    :getChildren="getChildren"
                    @selected="$emit('selected', $event, arguments[1])"
                    @opened="$emit('opened', $event, arguments[1])"
                     />
        </div>
    </div>
</template>

<script>
import Keyboard from '../keyboard';
import Mouse from '../mouse';
import { clone } from '../classes/utils';
import ddb from 'ddb';
const { pathutils } = ddb;
import icons from '../classes/icons';

export default {
  props: {
      node: {
          type: Object
      },
      getChildren: {
        type: Function,
        required: true
    }
  },
  components: { TreeNode: () => import('./TreeNode.vue') },
  data: function(){
      return {
          children: [],
          loading: false,
          loadedChildren: false,
          empty: false,
          selected: false,
          expanded: false,
      }
  },
    mounted: async function(){
        if (this.node.expanded){
            await this.handleOpenDblClick(new CustomEvent('click'));
        }

        this.$root.$on('deletedEntries', async (deleted) => {
            
            var els = this.children.filter(item => deleted.includes(item.entry.path));

            if (els.length == 0) return;

            this.children = this.children.filter(item => !deleted.includes(item.entry.path));
        });

        this.$root.$on('addEntries', async (entries) => {
            
            console.log("In addEntries");
            console.log(clone(entries));

            var parentPath = pathutils.getParentFolder(entries[0].path);
            console.log(clone(parentPath));

            if (parentPath == null) {
                if (!this.node.root) return;
            } else 
                if (parentPath != this.node.path) return;

            console.log("createFolder in " + this.node.path);
            debugger;
            this.children = this.children.filter(ch => entries.filter(e => e.path == ch.entry.path).length == 0);

            for(var entry of entries) {

                const base = pathutils.basename(entry.path);

                this.children.push({
                    icon: icons.getForType(entry.type),
                    label: base,
                    path: pathutils.join(this.node.path, base),
                    selected: false,
                    entry,
                    isExpandable: ddb.entry.isDirectory(entry)
                });

            }

            this.children = this.children.sort((n1, n2) => {

                var a = n1.entry;
                var b = n2.entry;
                
                // Folders first
                let aDir = ddb.entry.isDirectory(a);
                let bDir = ddb.entry.isDirectory(b);

                if (aDir && !bDir) return -1;
                else if (!aDir && bDir) return 1;
                else {
                    // then filename ascending
                    return pathutils.basename(a.path.toLowerCase()) > pathutils.basename(b.path.toLowerCase()) ? 1 : -1
                }
            });
            

        });
       
    },
    methods: {
        onClick: function(e){
            Keyboard.updateState(e);
            this.$emit('selected', this, Mouse.LEFT);
        },
        onRightClick: function(e){
            Keyboard.updateState(e);
            this.$emit('selected', this, Mouse.RIGHT);
        },
        handleOpenDblClick: async function(e){
            return this._handleOpen(e, "dblclick");
        },
        handleOpenCaret: async function(e){
            return this._handleOpen(e, "caret");
        },

        loadChildren: async function() {

            console.log("In loadChildren");
            //debugger;
            if (this.node.isExpandable && !this.loadedChildren){
                this.loading = true;
                try{
                    this.children = await this.getChildren(this.node.path);
                    this.loadedChildren = true;

                    // Empty?
                    //if (!this.children) this.node.getChildren = null;
                }catch(e){
                    console.warn(e);
                }
                this.loading = false;
            }
        },

        expand: async function(sender) {
            
            console.log("In expand");
            console.log(clone(sender));

            await this.loadChildren();

            // Empty?
            if (this.loadedChildren && this.children.length === 0){
                this.empty = true;
                this.expanded = false;
            }else if (this.node.isExpandable){
                // Toggle
                this.expanded = !this.expanded;
            }

            this.$emit('opened', this, sender);
        },

        _handleOpen: async function(e, sender){

            console.log("In _handleOpen");
            console.log(clone(e));
            console.log(clone(sender));

            e.stopPropagation();
            if (Keyboard.isModifierPressed()) return; // We are selecting

            await this.expand(sender);          
        }
  }
}
</script>

<style scoped>
.tree-node{
    .entry{
        padding: 2px 4px 2px 4px;
        display: inline-block;
        white-space: nowrap;
        min-width: 100%;

        &:hover{
            background: #eee;
            cursor: pointer;
        }
        &:focus,&:active{
            background: #dadada;
        }
        &.selected{
            background: #ddd;
        }
    }

    i{
        display: inline-block;
        margin-top: 1px;
        margin-right: 0px;
    }
    .text{
        display: inline-block;
        margin-left: 2px;
        white-space: nowrap;
        word-break: keep-all;
    }
    .circle.notch{
        margin-left: -5px;
    }
    .children{
        margin-left: 16px;
    }
}
</style>