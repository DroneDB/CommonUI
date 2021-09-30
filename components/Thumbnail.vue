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
            <img v-if="thumbnail !== null && !loading" :src="thumbnail" ref="image" />
            <i class="icon icon-file " :class="icon" :style="iconStyle" v-if="icon && !loading" />
            <i class="icon circle notch spin loading" v-if="loading || (thumbnail === null && icon === null)" />
        </div>
        {{filename}}
    </div>
</template>

<script>
import { thumbs, pathutils } from 'ddb';
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
      },
      lazyLoad: {
          type: Boolean,
          default: false
      }
  },
  data: function(){
      let filename = pathutils.basename(this.file.path);
      if (filename === "") filename = this.file.path;
      
      return {
          filename,
          thumbnail: null,
          icon: null,
          error: null,
          iconStyle: {
            fontSize: parseInt(this.size / 3) + 'px'
          },
          sizeStyle: {
              width: this.size + 'px',
              height: this.size + 'px'
          },
          loading: false
      }
  },
  mounted: async function(){
      if (!this.lazyLoad) await this.loadThumbnail();
  },
  methods: {
      getBoundingRect: function(){
          return this.$el.getBoundingClientRect();
      },
      loadThumbnail: async function(){
        if (this.loadingThumbnail) return; // Already loading
        if (this.thumbnail && !this.error) return; // Already loaded

        this.loadingThumbnail = true;

        try{
            if (thumbs.supportedForType(this.file.entry.type)){
                this.thumbnail = await thumbs.fetch(this.file.path);
            }else{
                this.icon = this.file.icon;
            }
            this.loadingThumbnail = false;
        }catch(e){
            console.warn(e);
            this.error = e;
            this.icon = "exclamation triangle";
            this.loadingThumbnail = false;
        }
      },
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
    transition: 0.25s background-color ease;
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
            max-height: 100%;
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