<template>
    <Window :title="title" id="alert" @onClose="dismiss('cancel')" 
            :modal="true"
            maxWidth="70%"
            :fixedSize="true">
        
        <slot/>

        <div class="buttons">
            <button @click="dismiss('ok')" class="ui primary button" v-if="buttons.indexOf('ok') !== -1">
                OK
            </button>
        </div>
    </Window>
</template>

<script>
import Window from './Window.vue';

export default {
  components: {
      Window
  },
  props: {
      title: {
        type: String,
        default: '',
        required: false
      },
      message: {
        type: String,
        default: '',
        required: false
      },
      buttons: {
        type: Array,
        default: () => ['ok'],
        required: false
      }
  },
  
  data: function(){
      return {};
  },
  mounted: function(){
  },
  methods: {
      dismiss: function(buttonId){
          this.$emit('onClose', buttonId);
      }
  }
}
</script>

<style scoped>
.buttons{
    text-align: center;
}
</style>