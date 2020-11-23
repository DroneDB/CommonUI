<template>
<div class="window-container" :class="{modal}">
    <div class="window"
        :style="winStyle"
        :id="id"
        :class="{dragging, resizing}"
        ref="window"
        @mousedown="handleZ"
        >
        <div class="title" ref="title">
            <div class="text">{{title}}</div> 
            <div class="close" @mousedown="closeMouseDown">
                <i class="icon close"></i>
            </div>
        </div>
        <div class="content">
            <slot/>
        </div>
    </div>
</div>
</template>

<script>
import Mouse from '../mouse';

// Global
let ZIndex = 1;
let TopMost = null;

export default {
  components: {
  },
  props: {
      title:{
          type: String,
          default: ""
      },
      fixedSize:{
          type: Boolean,
          default: false
      },
      maxWidth:{
          type: String,
          default: "auto"
      },
      id:{
          type: String,
          required: true
      },
      modal:{
          type: Boolean,
          default: false
      }
  },
  data: function(){
      const winStyle = JSON.parse(window.localStorage.getItem(`winStyle_${this.id}`) || "{}");

      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!winStyle.width) winStyle.width = "30%";
      if (!winStyle.height) winStyle.height = "40%";
      
      const ww = (parseFloat(winStyle.width) / 100.0) * w;
      const wh = (parseFloat(winStyle.height) / 100.0) * h;

      if (!winStyle.left) winStyle.left = (50.0 - (ww / w * 100.0) / 2.0) + "%";
      if (!winStyle.top) winStyle.top = (50.0 - (wh / h * 100.0) / 2.0) + "%";

      // Auto width/height
      if (this.fixedSize){
          winStyle.width = "auto";
          winStyle.height = "auto";
          winStyle.maxWidth = this.maxWidth;
          winStyle.visibility = "hidden";
          winStyle.left = winStyle.top = winStyle.bottom = winStyle.right = "";
      }

      winStyle.zIndex = ZIndex++;
      winStyle.cursor = "";

      return { 
          winStyle,
          dragging: false,
          resizing: false
       };
  },
  mounted: function(){
      Mouse.on("mouseup", this.mouseUp);
      Mouse.on("mousedown", this.mouseDown);
      Mouse.on("mousemove", this.mouseMove);

      // Center if this is fixed (needs to be computed after mount)
      if (this.fixedSize && this.winStyle.visibility === "hidden"){
          const w = window.innerWidth;
          const h = window.innerHeight;
          const ww = this.$refs.window.clientWidth;
          const wh = this.$refs.window.clientHeight;

          this.winStyle.left = (50.0 - (ww / w * 100.0) / 2.0) + "%";
          this.winStyle.top = (50.0 - (wh / h * 100.0) / 2.0) + "%";

          this.winStyle.visibility = "";
      }
  },
  beforeDestroy: function(){
      Mouse.off("mouseup", this.mouseUp);
      Mouse.off("mousedown", this.mouseDown);
      Mouse.off("mousemove", this.mouseMove);
  },
  methods: {
      setOnTop: function(){
          if (this.winStyle.zIndex < ZIndex) this.winStyle.zIndex = ZIndex++;
      },

      handleZ: function(e){
          if (!e.zHandled){
              this.setOnTop();
              e.zHandled = true;
              TopMost = this;
          }
      },
      
      mouseDown: function(e){
          if (TopMost !== this) return;

          if (e.target.parentElement === this.$refs.title){
            this.dragging = true;
            this.startDrag = {
                x: e.clientX,
                y: e.clientY,
                winLeft: parseFloat(this.winStyle.left),
                winTop: parseFloat(this.winStyle.top),
            };
            return;
          }

          if (this.winStyle.cursor.endsWith("-resize")){
            this.resizing = true;

            this.startResize = {
              x: e.clientX,
              y: e.clientY,
              winWidth: parseFloat(this.winStyle.width),
              winHeight: parseFloat(this.winStyle.height),
              winLeft: parseFloat(this.winStyle.left)
            };
          }
      },

      mouseUp: function(e){
          this.dragging = false;
          this.resizing = false;
          this.winStyle.cursor = "";

          window.localStorage.setItem(`winStyle_${this.id}`, JSON.stringify(this.winStyle)); 
      },

      mouseMove: function(e){
          if (this.dragging){
            const deltaX = e.clientX - this.startDrag.x,
                    deltaY = e.clientY - this.startDrag.y;
            const w = window.innerWidth;
            const h = window.innerHeight;

            this.winStyle.left = (this.startDrag.winLeft + (deltaX / w) * 100.0) + '%';
            this.winStyle.top = (this.startDrag.winTop + (deltaY / h) * 100.0) + '%';
          }

          if (this.resizing){
              const deltaX = e.clientX - this.startResize.x,
                    deltaY = e.clientY - this.startResize.y;
              const w = window.innerWidth;
              const h = window.innerHeight;
              const cursor = this.winStyle.cursor;

              let width = this.winStyle.width;
              let height = this.winStyle.height;
              let left = this.winStyle.left;

              if (cursor.startsWith("e") || cursor.startsWith("se")){
                  // Modify width from right
                  width = (this.startResize.winWidth + (deltaX / w) * 100.0) + '%';
              }
              if (this.winStyle.cursor.startsWith("s")){
                  // Modify height from bottom
                  height = (this.startResize.winHeight + (deltaY / h) * 100.0) + '%';
              }
              if (cursor.startsWith("w") || cursor.startsWith("sw")){
                  // Modify width from left (need to move left prop)
                  width = (this.startResize.winWidth - (deltaX / w) * 100.0) + '%';
                  left = (this.startResize.winLeft + (deltaX / w) * 100.0) + '%';
              }

              if (parseFloat(width) > 5.0 && parseFloat(height) > 5.0){
                  this.winStyle.width = width;
                  this.winStyle.height = height;
                  this.winStyle.left = left;
              }
          }else if (Mouse.intersects(e, this.$refs.window) && !this.fixedSize){
            const left = this.$refs.window.offsetLeft,
                    right = left + this.$refs.window.clientWidth,
                    top = this.$refs.window.offsetTop,
                    bottom = top + this.$refs.window.clientHeight;
            const MARGIN = 12;

            const south = (bottom - e.clientY) < MARGIN && (bottom - e.clientY) > 0,
                west = (e.clientX - left) < MARGIN && (e.clientX - left) > 0,
                east = (right - e.clientX) < MARGIN && (right - e.clientX) > 0;
            let cursor = "";
            if (south) cursor += "s";
            if (east) cursor += "e";
            if (west) cursor += "w";
            if (cursor !== "") cursor += "-resize";

            this.winStyle.cursor = cursor;
          }
      },

      closeMouseDown: function(e){
          e.stopPropagation();

          this.$emit("onClose");
      }
  }
}
</script>

<style scoped>
.window{
    background: #fefefe;
    position: absolute;
    z-index: 3;
    border-radius: 4px;
    box-shadow: 1px 1px 4px -2px #030A03;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    user-select: none;

    .title{
        display: flex;
        user-select: none;
        background-color: #ddd;
        padding: 2px 0px 2px 6px;
        font-weight: bold;
        &:hover{
            cursor: pointer;
            background-color: #eee;
        }
        .text{
            flex-grow: 1;
            overflow: hidden;
        }
        .close{
            padding: 0px 0px 0px 2px;
            &:hover{
                cursor: pointer;
                color: #444444;
            }
            &:active,&:focus{
                color: #fefefe;
            }
        }
    }

    &.dragging{
        .title{
            cursor: move;
            background-color: #dadada;
        }
    }

    &.dragging,&.resizing{
        opacity: 0.5;
    }

    .content{
        overflow: auto;
        flex-grow: 1;
        user-select: text;
        margin: 6px;
    }
}
.window-container.modal{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3);
    z-index: 2;
    .window{
        box-shadow: 0px 0px 12px -2px #030A03
    }
}
</style>