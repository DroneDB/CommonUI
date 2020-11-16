<template>
<div id="explorer" @click="onClick" :class="{loading}">
    <Thumbnail v-for="(f, idx) in files" :file="f" :key="f.path" :data-idx="idx" ref="thumbs" @clicked="handleSelection" @open="handleOpen" />
</div>
</template>

<script>
import Thumbnail from './Thumbnail.vue';
import Keyboard from '../keyboard';
import Mouse from '../mouse';

import { entry } from 'ddb';
import shell from 'commonui/dynamic/shell';
import {
    registerContextMenu,
    unregisterContextMenu
} from 'commonui/dynamic/menu';

export default {
    components: {
        Thumbnail
    },
    props: ['files'],
    data: function () {
        return {
            loading: false
        };
    },
    computed: {
        selectedFiles: function () {
            return this.files.filter(f => f.selected);
        }
    },
    mounted: function () {
        this.rangeStartThumb = null;

        registerContextMenu(this.$el, [{
                label: "Open Item Location",
                click: () => {
                    if (this.selectedFiles.length > 0) shell.showItemInFolder(this.selectedFiles[0].path);
                },
                accelerator: "Alt+CmdOrCtrl+R",
            },
            {
                type: 'separator'
            },
            {
                label: "Share",
                accelerator: "CmdOrCtrl+S",
                click: () => {
                    if (this.selectedFiles.length > 0) dispatchEvent(new Event("btnShare_Click"));
                }
            },
            {
                type: 'separator'
            },
            {
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
            }
        ]);
    },
    destroyed: function () {
        unregisterContextMenu(this.$el);
    },
    methods: {
        onClick: function (e) {
            // Clicked an empty area
            if (e.target === this.$el) {
                this.deselectAll();
            }
        },
        selectAll: function () {
            this.files.forEach(f => f.selected = true);
        },
        deselectAll: function () {
            this.files.forEach(f => f.selected = false);
        },
        handleOpen: async function (thumb) {
            const file = thumb.file;

            if (entry.isDirectory(file.entry)) {
                // Expand directory
                // TODO: can we/should we cache results?
                if (file.getChildren && !file.children) {
                    thumb.loading = true;
                    this.loading = true;
                    try {
                        file.children = await file.getChildren();
                    } catch (e) {
                        console.warn(e);
                    }
                    thumb.loading = false;
                    this.loading = false;
                }

                this.$emit("folderOpened", file.children);
            } else {
                shell.openItem(file.path);
            }
        },
        handleSelection: function (thumb, mouseBtn) {
            if (!thumb) return; // Top
            if (mouseBtn === Mouse.RIGHT && this.selectedFiles.length > 1) return; // Prevent accidental deselection
            const file = thumb.file;

            // Multiple selection
            if (Keyboard.isCtrlPressed()) {
                file.selected = !file.selected;
            } else if (Keyboard.isShiftPressed() && this.selectedFiles.length > 0 && this.rangeStartThumb) {
                // Range selection
                this.selectedFiles.forEach(f => f.selected = false);
                this.selectRange(this.rangeStartThumb, thumb, this.$refs.thumbs);
            } else {
                // Single selection
                if (!file.selected || this.selectedFiles.length > 1) {
                    this.selectedFiles.forEach(f => f.selected = false);
                    file.selected = true;
                } else if (!mouseBtn === Mouse.RIGHT) { // Do not deselect with mouse right
                    this.selectedFiles.forEach(f => f.selected = false);
                    file.selected = false;
                }
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
        }
    }
}
</script>

<style scoped>
#explorer {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
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
</style>
