<template>
<div class="file-browser">
    <TreeView :nodes="nodes" @selectionChanged="handleSelectionChanged" @opened="handleOpen" />

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
const { pathutils} = ddb;
import icons from '../classes/icons';

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

        const rootNodes = await this.rootNodes();
        for (let i = 0; i < rootNodes.length; i++){
            const n = rootNodes[i];
            const getChildren = async function () {
                try {
                    const entries = await ddb.fetchEntries(this.path, {
                        withHash: false,
                        recursive: true,
                        maxRecursionDepth: 1,
                        stopOnError: false
                    });

                    return entries.filter(entry => {
                            return pathutils.basename(entry.path)[0] != "." // Hidden files/folders
                        })
                        .sort((a, b) => {
                            // Filename ascending
                            return pathutils.basename(a.path.toLowerCase()) > pathutils.basename(b.path.toLowerCase()) ? 1 : -1
                        })
                        .map(entry => {
                            const base = pathutils.basename(entry.path);

                            return {
                                icon: icons.getForType(entry.type),
                                label: base,
                                path: pathutils.join(this.path, base),
                                getChildren: ddb.entry.isDirectory(entry) ? getChildren : null,
                                selected: false,
                                entry
                            }
                        });
                } catch (e) {
                    if (e.message == "Unauthorized"){
                        this.$emit('unauthorized');
                    }else{
                        console.error(e);
                    }
                    return [];
                }
            };

            try{
                const entry = n.entry || (await ddb.fetchEntries(n.path, {
                    withHash: false
                }))[0];

                this.nodes.push({
                    icon: n.icon,
                    label: n.label,
                    path: n.path,
                    getChildren,
                    selected: false,
                    expanded: !!n.expanded,
                    root: true,
                    entry
                });
            }catch(e){
                if (e.message == "Unauthorized"){
                    this.$emit('unauthorized');
                }else{
                    console.error(e);
                }
            }
        }

        this.loading = false;
    },
    beforeDestroy: function () {
        unregisterContextMenu(this.$el);
    },
    methods: {
        handleSelectionChanged: function (selectedNodes) {
            // Keep track of nodes for "Open Item Location"
            if (selectedNodes.length > 0) this.lastSelectedNode = selectedNodes[selectedNodes.length - 1];
            else this.lastSelectedNode = null;

            // If a folder is expanded and we select it, 
            // we select it's children instead.
            if (selectedNodes.length === 1) {
                const n = selectedNodes[0];
                if (n.expanded && n.$children && n.$children.length > 0) {
                    selectedNodes = n.$children;
                }
            }

            this.$emit('selectionChanged', selectedNodes.map(n => n.node));
        },
        handleOpen: function (component, sender) {
            const node = component.node;

            // Open file in default program
            if (!ddb.entry.isDirectory(node.entry)) {
                shell.openItem(node.path);
            } else {
                // Select children of item
                if (component.children && sender === "dblclick") {
                    this.$emit('selectionChanged', component.children);
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
