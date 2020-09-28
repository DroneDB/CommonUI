<template>
    <Window title="Properties" id="properties" @onClose="$emit('onClose', $event, arguments[1])">
    <div v-if="files.length === 1">
        <table class="ui celled definition unstackable table">
            <tbody>
                <tr>
                    <td>Name</td>
                    <td>{{files[0].label}}</td>
                </tr>
                <tr v-if="files[0].entry.size">
                    <td>Size</td>
                    <td>{{bytesToSize(files[0].entry.size)}}</td>
                </tr>
                <tr>
                    <td>Type</td>
                    <td>{{typeToHuman(files[0])}}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div v-if="files.length >= 2">
        <div>{{files.length}} items</div>
        <table class="ui celled definition unstackable table mt">
            <tbody>
                <tr>
                    <td>Size</td>
                    <td>{{sumSizes(files)}}</td>
                </tr>
                <tr>
                    <td>Type</td>
                    <td>{{typesToHuman(files)}}</td>
                </tr>
            </tbody>
        </table>
    </div>
    </Window>
</template>

<script>
import Window from './Window.vue';
import ddb from 'ddb';

export default {
  components: {
      Window
  },
  props: ['files'],
  data: function(){
      return {};
  },
  mounted: function(){
  },
  methods: {
      typeToHuman: function(file){
          return ddb.entry.typeToHuman(file.entry.type);
      },

      typesToHuman: function(files){
          if (!files) return "";
          if (!files.length) return "";

          const types = {};
          files.forEach(f => types[this.typeToHuman(f)] = true);
          const keys = Object.keys(types);
          if (keys.length >= 2){
              return "Multiple types";
          }else{
              return "All of type " + this.typeToHuman(files[0]);
          }
      },

      bytesToSize(bytes, decimals = 2){
        if(bytes == 0) return '0 byte';
        var k = 1000; // or 1024 for binary
        var dm = decimals || 3;
        var sizes = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      },

      sumSizes(files){
        let sum = 0;
        files.forEach(f => {
            if (f.entry) sum += f.entry.size;
        });
        return this.bytesToSize(sum);
      }
  }
}
</script>

<style scoped>
.ui.table{
    word-break: break-all;
    &.mt{
        margin-top: 8px;
    }
    td:first-child{
        width: 70px;
    }
}
</style>