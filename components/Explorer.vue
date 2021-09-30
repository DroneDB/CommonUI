<template>
<div id="explorer-container" >
    <ContextMenu :items="contextMenu" />
    <Toolbar :tools="tools" v-if="tools" />
    <div id="search-box">
        <div id="cancel" v-if="filter != null && filter.length > 0" v-on:click="filter = null">
            <i class="icon cancel"></i></div>
        <input type="text" v-model="filter" v-on:click="clearSelection">
        <div id="src"><i class="icon search"></i></div>        
    </div>
    <div v-if="currentPath" class="breadcrumbs" >{{ currentPath }}</div>
    <div ref="explorer" id="explorer" @click="onClick" :class="{loading}" @scroll="onScroll">
    <div v-for="(f, idx) in filterFiles" :key="'E,' + f.path"  draggable
                @dragstart="startDrag($event, f)"
                @drop="onDrop($event, f)"
                @dragover.prevent
                @dragenter.prevent>
        <Thumbnail 
        :file="f"         
        :data-idx="idx" 
        ref="thumbs" 
        @clicked="handleSelection" 
        @open="handleOpen"
        :lazyLoad="true"                
            />    
    </div>    
    </div>    
</div>
</template>

<script>
import Thumbnail from './Thumbnail.vue';
import Toolbar from 'commonui/components/Toolbar.vue';
import Keyboard from '../keyboard';
import Mouse from '../mouse';
import { clone } from 'commonui/classes/utils';

import ddb from 'ddb';
const { pathutils } = ddb;

import { entry } from 'ddb';
import shell from 'commonui/dynamic/shell';
import env from 'commonui/dynamic/env';
import ContextMenu from 'commonui/components/ContextMenu';

export default {
    components: {
        Thumbnail, Toolbar, ContextMenu
    },
    props: ['files', 'currentPath', 'tools'],
    data: function () {
        let contextMenu = [];

        if (env.isElectron()){
            contextMenu = contextMenu.concat([{
                        label: "Open Item Location",
                        click: () => {
                            if (this.selectedFiles.length > 0) shell.showItemInFolder(this.selectedFiles[0].path);
                        },
                        accelerator: "Alt+CmdOrCtrl+R",
                    },{
                        type: 'separator'
                    },{
                        label: "Share",
                        accelerator: "CmdOrCtrl+S",
                        click: () => {
                            if (this.selectedFiles.length > 0) dispatchEvent(new Event("btnShare_Click"));
                        }
                    },{
                        type: 'separator'
                    }]);
        }

        contextMenu = contextMenu.concat([{
                    label: 'Open Item',
                    click: () => {
                        this.selectedFiles.forEach(f => {
                            this.$emit('openItem', f);
                        });
                    }
                },{
                    label: "Select All/None",
                    accelerator: "CmdOrCtrl+A",
                    click: () => {
                        if (!this.$refs.thumbs) return;
                        if (this.selectedFiles.length === this.$refs.thumbs.length) {
                            this.deselectAll();
                        } else {
                            this.selectAll();
                        }
                    }
                },
                {
                    label: "Properties",
                    accelerator: "CmdOrCtrl+P",
                    click: () => {
                        this.$emit("openProperties");
                    }
                }]);

        return {
            filter: null,
            loading: false,
            contextMenu
        };
    },
    computed: {
        selectedFiles: function () {
            return this.files.filter(f => f.selected);
        },
        filterFiles: function() {
            
            if (this.filter == null || this.filter.length == 0) {
                return this.files;
            } else {
                var lowerFilter = this.filter.toLowerCase();
                return this.files.filter(i => i.entry.path.toLowerCase().includes(lowerFilter));
            }
        }
    },
    mounted: function () {
        this.rangeStartThumb = null;
    },
    updated: function(){
        this.lazyLoadThumbs();
    },
    methods: {

        startDrag: (evt, item) => {
            evt.dataTransfer.dropEffect = 'move';
            evt.dataTransfer.effectAllowed = 'move';
            
            evt.dataTransfer.setData('item', JSON.stringify(clone(item)));
        },

        onDrop (evt, item) {
                            
            if (entry.isDirectory(item.entry)) {   
                const destFolder = item.entry.path;
                const sourceItem = JSON.parse(evt.dataTransfer.getData('item'));
                
                this.drop(sourceItem, destFolder);

                this.selectedFiles.forEach(selItem => {
                    if (selItem.entry.path == sourceItem.entry.path) return;
                    this.drop(selItem, destFolder);
                });
            }
        },

        drop (sourceItem, destFolder) {
            
            if (entry.isDirectory(sourceItem.entry) && destFolder.startsWith(sourceItem.entry.path)) {
                this.$log.info("Cannot copy a folder on itself or one of its descendants");
                return;
            }
            
            const destPath = pathutils.join(destFolder, pathutils.basename(sourceItem.entry.path));

            this.$emit('moveItem', sourceItem, destPath);
        },

        onTabActivated: function(){
            this.$nextTick(() => {
                this.lazyLoadThumbs();
            });
        },

        onPanelResized: function(){
            this.$nextTick(() => {
                this.lazyLoadThumbs();
            });
        },

        onClick: function (e) {
            
            // Clicked an empty area
            if (e.target.id === 'explorer') {
                this.clearSelection();
            }
        },
        lazyLoadThumbs: function(){
            if (!this.$refs.thumbs) return;

            const parentBcr = this.$el.getBoundingClientRect();
            this.$refs.thumbs.forEach(t => {
                const thumbBcr = t.getBoundingRect();
                if (thumbBcr.bottom - parentBcr.top  > 0 &&
                    parentBcr.bottom - thumbBcr.top > 0 &&
                    thumbBcr.right - parentBcr.left > 0 &&
                    parentBcr.right - thumbBcr.left > 0){
                    t.loadThumbnail();
                }
            });
        },
        onScroll: function(){
            if (this.scrollTimeout){
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = null;
            }
            this.scrollTimeout = setTimeout(() => {
                this.lazyLoadThumbs();
            }, 250);
        },
        selectAll: function () {
            this.filterFiles.forEach(f => f.selected = true);
        },
        deselectAll: function () {
            this.filterFiles.forEach(f => f.selected = false);
        },
        clearSelection: function() {
            this.files.forEach(f => f.selected = false);
        },
        handleOpen: async function (thumb) {
            const file = thumb.file;

            this.filter = null;

            if (entry.isDirectory(file.entry)) {
                this.$root.$emit("folderOpened", pathutils.getTree(file.entry.path));
            } else {
                this.$emit('openItem', file);
            }
        },
        handleSelection: function (thumb, mouseBtn) {
            if (!thumb) return; // Top
            // if (mouseBtn === Mouse.RIGHT && this.selectedFiles.length > 1) return; // Prevent accidental deselection
            const file = thumb.file;

            if (Keyboard.isShiftPressed() && this.selectedFiles.length > 0 && this.rangeStartThumb) {
                // Range selection
                this.selectedFiles.forEach(f => f.selected = false);
                this.selectRange(this.rangeStartThumb, thumb, this.$refs.thumbs);
            } else {

                this.$log.info("File", clone(file));
                // Single selection
                if (mouseBtn === Mouse.RIGHT) {
                    if (!file.selected) this.selectedFiles.forEach(f => f.selected = false);
                    file.selected = false;
                }
                file.selected = !file.selected;
                this.rangeStartThumb = thumb;
            }
        },

        selectRange: function (low, high, thumbs) {
            if (!thumbs) return;

            let idxLow = parseInt(low.$el.getAttribute('data-idx')),
                idxHigh = parseInt(high.$el.getAttribute('data-idx'));

            if (idxLow > idxHigh) {
                [low, high] = [high, low];
                [idxLow, idxHigh] = [idxHigh, idxLow];
            }

            let $n = low.$el;
            while ($n != high.$el) {
                const f = thumbs[parseInt($n.getAttribute('data-idx'))].file;
                f.selected = true;
                $n = $n.nextSibling;
            }

            // Select last
            const f = thumbs[parseInt($n.getAttribute('data-idx'))].file;
            f.selected = true;
        },

        scrollTo: function(file){
            const thumb = this.$refs.thumbs.find(t => t.file === file);
            if (thumb){
                this.$refs.explorer.scrollTo(0, thumb.$el.offsetTop - this.$el.offsetTop - 12);
            }
        }
    }
}
</script>

<style scoped>
#explorer {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    width: 100%;
    height: 100%;
    padding: 8px;
    overflow-y: auto;
    user-select: none;

    &.loading {
        opacity: 0.5;
        pointer-events: none;
    }
}

#explorer-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .breadcrumbs{
        padding: 4px;
        word-break: break-all;
        overflow: hidden;
        border-bottom: 1px solid #030A03;
        border-top: 1px solid #bbbbbb;
    }
}

#search-box {
    position: absolute;
    right: 10px;
    height: 34px;
    display: flex;
    align-items: center;

    input {
        width: 100%;
        text-align: center;
        width: 150px;
    }

    #cancel {
        cursor: pointer;
    }

    #src {
        margin-left: 5px;
    }
}
</style>
