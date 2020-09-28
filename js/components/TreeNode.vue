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
                            v-if="node.getChildren && !loading && !empty" />
            <i class="icon nonexistant" v-if="!node.getChildren || empty" />

            <i class="icon" :class="node.icon" />
            <div class="text">{{ node.label }}</div>
        </div>
        <div class="children" v-if="expanded">
            <TreeNode v-for="(node, index) in children" 
                    :node="node"
                    :key="node.path" 
                    ref="nodes"
                    @selected="$emit('selected', $event, arguments[1])"
                    @opened="$emit('opened', $event, arguments[1])"
                     />
        </div>
    </div>
</template>

<script>
import Keyboard from '../keyboard';
import Mouse from '../mouse';

export default {
  props: {
      node: {
          type: Object
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
      _handleOpen: async function(e, sender){
          e.stopPropagation();
          if (Keyboard.isModifierPressed()) return; // We are selecting
          
          if (this.node.getChildren && !this.loadedChildren){
            this.loading = true;
            try{
                this.children = await this.node.getChildren();
                this.loadedChildren = true;

                // Empty?
                if (!this.children) this.node.getChildren = null;
            }catch(e){
                console.warn(e);
            }
            this.loading = false;
          }

          // Empty?
          if (this.loadedChildren && this.children.length === 0){
            this.empty = true;
            this.expanded = false;
          }else if (this.node.getChildren){
            // Toggle
            this.expanded = !this.expanded;
          }

          this.$emit('opened', this, sender);
      }
  }
}
</script>

<style scoped>
.tree-node{
    .entry{
        padding: 2px 4px 2px 4px;
        display: flex;
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
        margin-top: 1px;
        margin-right: 0px;
        flex-shrink: 0;
    }
    .text{
        margin-left: 6px;
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