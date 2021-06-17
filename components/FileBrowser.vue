<template>
<div class="file-browser">
    <TreeView :nodes="nodes" @selectionChanged="handleSelectionChanged" @opened="handleOpen" :getChildren="getChildren" />

    <div v-if="loading" class="loading">
        <i class="icon circle notch spin" />
    </div>
</div>
</template>

<script>
import TreeView from './TreeView.vue';
import TreeNode from './TreeNode.vue';
import {
    registerContextMenu,
    unregisterContextMenu
} from 'commonui/dynamic/menu';
import shell from 'commonui/dynamic/shell';
import ddb from 'ddb';
import icons from '../classes/icons';
import { clone } from '../classes/utils';

const { pathutils } = ddb;

export default {
    components: {
        TreeView
    },
    props: {
        rootNodes: {
            type: Function,
            required: true
        }
    },
    data: function () {
        return {
            nodes: [],
            loading: true,
            lastSelectedNode: null,
        };
    },
    mounted: async function () {
        registerContextMenu(this.$el, [{
            label: "Open Item Location",
            click: () => {
                if (this.lastSelectedNode !== null) shell.showItemInFolder(this.lastSelectedNode.node.path);
            }
        }, {
            type: 'separator'
        }, {
            label: 'Properties',
            click: () => {
                if (this.lastSelectedNode !== null) {
                    this.$emit('selectionChanged', [this.lastSelectedNode.node]);
                    this.$emit("openProperties");
                }
            }
        }]);

        await this.refreshNodes();

    },
    beforeDestroy: function () {
        unregisterContextMenu(this.$el);
    },
    methods: {

        getChildren: async function(path) {

            this.$log.info("getChildren(path)", path);

            try {
                const entries = await ddb.fetchEntries(path, {
                    withHash: false,
                    recursive: true,
                    maxRecursionDepth: 1,
                    stopOnError: false
                });

                var res = entries.filter(entry => {
                        return pathutils.basename(entry.path)[0] != "." // Hidden files/folders
                    })
                    .sort((a, b) => {
                        // Folders first
                        let aDir = ddb.entry.isDirectory(a);
                        let bDir = ddb.entry.isDirectory(b);

                        if (aDir && !bDir) return -1;
                        else if (!aDir && bDir) return 1;
                        else {
                            // then filename ascending
                            return pathutils.basename(a.path.toLowerCase()) > pathutils.basename(b.path.toLowerCase()) ? 1 : -1
                        }
                    })
                    .map(entry => {
                        const base = pathutils.basename(entry.path);

                        return {
                            icon: icons.getForType(entry.type),
                            label: base,
                            path: pathutils.join(path, base),
                            selected: false,
                            entry,
                            isExpandable: ddb.entry.isDirectory(entry)
                        }
                    });
                this.$log.info("Entries", clone(res));
                return res;
            } catch (e) {
                this.$log.error("Exception", clone(e));

                if (e.message == "Unauthorized"){
                    this.$emit('error', "You are not allowed to perform this action", "Load entries");
                } else {
                    this.$emit('error', e, "Load entries");
                }
                return [];
            }

        },

        refreshNodes: async function() {

            this.nodes = [];

            this.loading = true;

            const rootNodes = await this.rootNodes();

            for (let i = 0; i < rootNodes.length; i++) {
                const n = rootNodes[i];
                
                try {
                    const entry = n.entry || (await ddb.fetchEntries(n.path, {
                        withHash: false
                    }))[0];

                    this.nodes.push({
                        icon: n.icon,
                        label: n.label,
                        path: n.path,
                        selected: false,
                        expanded: !!n.expanded,
                        root: true,
                        entry
                    });
                } catch(e) {
                    if (e.message == "Unauthorized"){
                        this.$emit('error', "You are not allowed to perform this action", "Load entries");
                    } else {
                        this.$emit('error', e, "Load entries");
                    }
                }
            }

            this.loading = false;
        },

        handleSelectionChanged: async function (selectedNodes) {

            this.$log.info("FileBrowser.handleSelectionChanged(selectedNodes)", selectedNodes);

            // Keep track of nodes for "Open Item Location"
            this.lastSelectedNode = selectedNodes.length > 0 ? selectedNodes[selectedNodes.length - 1] : null;
            /*é
            if (selectedNodes.length === 1) {
                const n = selectedNodes[0];
                if (n.expanded) {
                    selectedNodes = n.$children;
                } else if (n.isExpandable) {

                    // If not loaded yet
                    if (!n.loadedChildren)
                        await n.expand();

                    this.$emit('selectionChanged', n.children, n.node.entry.path);
                }
            } else {
                this.$emit('selectionChanged', selectedNodes.map(n => n.node));
            }*/

            // If a folder is expanded and we select it, 
            // we select it's children instead.
            if (selectedNodes.length === 1) {
                const n = selectedNodes[0];
                if (n.expanded) {
                    if (n.$children && n.$children.length > 0)
                        selectedNodes = n.$children;
                } else if (n.node.isExpandable) {

                    if (!n.loadedChildren) {
                        // Let's expand it
                        await n.loadChildren();                     
                    }

                    this.$emit('selectionChanged', n.children, n.node.entry.path);

                    return;

                }
            }
            

            this.$emit('selectionChanged', selectedNodes.map(n => n.node));
        },
        handleOpen: function (component, sender) {

            this.$log.info("FileBrowser.handleOpen(component, sender)", component, sender);

            const node = component.node;

            // Open file in default program
            if (!ddb.entry.isDirectory(node.entry)) {
                shell.openItem(node.path);
            } else {
                // Select children of item
                if (component.children && (sender === "dblclick" || sender === "explorer")) {
                    
                    // This could lead to problems if we nest multiple DRONEDBs
                    this.$emit('selectionChanged', component.children, node.entry.type == ddb.entry.type.DRONEDB ? null : node.entry.path);
                }
            }
        }
    }
}
</script>

<style scoped>
.file-browser {
    .loading {
        margin-left: 2px;
    }

    height: 100%;
    min-width: 100%;
    min-height: 100px;
}
</style>
