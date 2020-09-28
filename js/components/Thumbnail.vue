<template>
    <div class="thumbnail"
        :class="{selected: file.selected}"
        :title="error ? error : file.path"
        :style="{'maxWidth': size + 'px'}"
        @click="onClick"
        @contextmenu="onRightClick"
        @dblclick="onDblClick">
        <div class="container" :class="{bordered: thumbnail !== null}"
            :style="sizeStyle">
            <img v-if="thumbnail !== null && !loading" :src="thumbnail" />
            <i class="icon icon-file " :class="icon" :style="iconStyle" v-if="icon && !loading" />
            <i class="icon circle notch spin loading" v-if="loading || (thumbnail === null && icon === null)" />
        </div>
        {{filename}}
    </div>
</template>

<script>
import { thumbs } from 'ddb';
import path from 'path';
import Mouse from '../mouse';
import Keyboard from '../keyboard';

export default {
  components: {
  },
  props: {
      file: {
          type: Object,
          required: true
      },
      size: {
          type: Number,
          required: false,
          default: 128
      }
  },
  data: function(){
      let filename = path.basename(this.file.path);
      if (filename === "") filename = this.file.path;
      
      return {
          filename,
          thumbnail: null,
          icon: null,
          error: null,
          iconStyle: {
            fontSize: parseInt(this.size / 2) + 'px'
          },
          sizeStyle: {
              width: this.size + 'px',
              height: this.size + 'px'
          },
          loading: false
      }
  },
  mounted: async function(){
      try{
          // Only file:// protocol is supported
          if (this.file.entry.path.startsWith("file://") && thumbs.supportedForType(this.file.entry.type)){
            this.thumbnail = await thumbs.getFromUserCache(this.file.entry.path.substring("file://".length), this.file.entry.mtime, { thumbSize: this.size });
          }else{
            this.icon = this.file.icon;
          }
      }catch(e){
          console.warn(e);
          this.error = e;
          this.icon = "exclamation triangle";
      }
  },
  methods: {
      onClick: function(e){
          Keyboard.updateState(e);
          this.$emit('clicked', this, Mouse.LEFT);
      },
      onRightClick: function(e){
          Keyboard.updateState(e);
          this.$emit('clicked', this, Mouse.RIGHT);
      },
      onDblClick: function(){
        this.$emit("open", this);
      }
  }
}
</script>

<style scoped>
.thumbnail{
    margin: 2px;
    padding-top: 6px;
    padding-bottom: 6px;
    text-align: center;
    word-break: break-all;
    border-radius: 4px;
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
    .container{
        display: flex;
        align-items: flex-end;
        justify-content: center;
        .bordered{
            box-shadow: 2px 2px 6px -2px #030A03;
        }
        img{
            padding-right: 8px;
            padding-left: 8px;
            max-width: 100%;
        }
        margin-bottom: 4px;
        i.icon-file{
            display: inline-block;
            margin-top: auto;
        }
    }
    .icon.badge{
        font-size: 11px;

    }

    i.loading{
        position: relative;
        top: -40%;
    }
}
</style>