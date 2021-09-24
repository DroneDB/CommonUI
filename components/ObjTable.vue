<template>
<!--    <div v-if="parentRef[bindTo]" class="ui message" :class="className">
        <i class="close icon" @click="dismiss"></i>
        <span v-html="parentRef[bindTo]" />
    </div>-->    

    <div>
        <div v-if="Array.isArray(obj)" style="display: flex; align-items: center; flex-wrap: wrap">
            <div v-for="(item, index) in obj" style="margin: 5px; padding: 5px">
                <ObjTable :obj="item"></ObjTable>
            </div>
        </div>
        <div v-else-if="typeof obj === 'object'">
            <table class="ui compact celled definition unstackable table">
                <tbody>
                    <tr v-for="(val, key) in obj" :key="key">
                        <td style="white-space: nowrap;">
                            {{beautify(key)}}<span v-if="Array.isArray(val)">&nbsp;[{{val.length}}]</span>
                        </td>
                        <td>
                            <div v-if="key=='projection'" class="wrap">
                                {{wrapIt(val)}}
                            </div>
                            <div v-else-if="key=='captureTime'">
                                {{new Date(val)}}
                            </div>
                            <div v-else-if="typeof val === 'string'">
                                {{val}}
                            </div>
                            <ObjTable v-else :obj="val"></ObjTable>
                        </td>
                    </tr>            
                </tbody>
            </table>             
        </div>  
        <div v-else>
            {{obj}}                        
        </div>
    </div>
</template>

<script>

export default {
    components: {
        ObjTable: () => import('./ObjTable.vue')
    },
    props: ["obj"],

    data: function(){
        return {};
    },
    beforeMount: function(){
    },
    methods: {
        beautify(name) {
            if (typeof name !== 'string') return name;
            return name[0].toUpperCase() + name.substring(1).replace(/([a-z])([A-Z0-9])/g, '$1 $2');
        },
        wrapIt(str) {
            return str.replace(/\,/g, ', ');
        }
    }
}
</script>

<style scoped>
.wrap { 
   word-wrap: break-word;
   white-space: normal;
}
</style>