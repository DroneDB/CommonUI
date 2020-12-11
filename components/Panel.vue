<template>
<div>
    <slot />
</div>
</template>

<script>
import Mouse from '../mouse';

export default {
  components: {
  },
  props: {
      split: {
          type: String,
          default: "vertical"
      },
      amount: {
          type: String,
          default: "50%"
      }
  },
  
  data: function(){
      return {
          panel0Style: {
              width: this.split === "vertical" ? this.amount : "100%",
              height: this.split === "horizontal" ? this.amount : "100%"
          },
          panel1Style: {
              width: this.split === "vertical" ? (100 - parseFloat(this.amount)) + "%" : "100%",
              height: this.split === "horizontal" ? (100 - parseFloat(this.amount)) + "%" : "100%"
          },
          resizing: false,
          canResize: false,
      };
  },
  mounted: function(){
      Mouse.on("mouseup", this.mouseUp);
      Mouse.on("mousedown", this.mouseDown);
      Mouse.on("mousemove", this.mouseMove);

      // Update styles
      this.updateStyle(this.$el.children[0], this.panel0Style);
      this.updateStyle(this.$el.children[1], this.panel1Style);

      // Propagate resized events
      this.$el.addEventListener('resized', this.sendResizedEvent);
  },
  beforeDestroy: function(){
      Mouse.off("mouseup", this.mouseUp);
      Mouse.off("mousedown", this.mouseDown);
      Mouse.off("mousemove", this.mouseMove);

      this.$el.removeEventListener('resized', this.sendResizedEvent);
  },
  methods: {
      updateStyle: function(el, style){
        el.style.width = style.width;
        el.style.height = style.height;
      },
      sendResizedEvent: function(){
          for (let i = 0; i < this.$el.children.length; i++){
            const el = this.$el.children[i];
            el.dispatchEvent(new Event('resized'));
          }
      },
      mouseDown: function(e){
          if (this.canResize){
            this.resizing = true;

            const w = window.innerWidth;
            const h = window.innerHeight;

            this.startResize = {
              x: e.clientX,
              y: e.clientY,
              panelWidth: this.$el.children[0].style.width,
              panelHeight: this.$el.children[0].style.height
            };
          }
      },

      mouseUp: function(e){
          if (this.resizing){
            this.sendResizedEvent();
          }

          this.resizing = false;
          this.canResize = false;
          Mouse.setCursor();
      },

      mouseMove: function(e){
          if (this.resizing){
              const deltaX = e.clientX - this.startResize.x,
                    deltaY = e.clientY - this.startResize.y;
              const w = window.innerWidth;
              const h = window.innerHeight;

              let width = parseFloat(this.startResize.panelWidth);
              let height = parseFloat(this.startResize.panelHeight);

              if (this.split === "vertical" && this.canResize){
                  // Modify width from right
                  width += ((deltaX / w) * 100.0);
              }else if (this.split === "horizontal" && this.canResize){
                  // Modify width from right
                  height += ((deltaY / h) * 100.0);
              }

              if (this.split === "vertical" && width > 5.0 && width < 95.0){
                this.panel0Style.width = width + '%';
                this.panel1Style.width = (100 - width) + '%';
              }else if (this.split === "horizontal" && height > 5.0 && height < 95.0){
                this.panel0Style.height = height + '%';
                this.panel1Style.height = (100 - height) + '%';
              }
          }else if (e.target.parentElement === this.$el || (e.target.parentElement || {}).parentElement === this.$el){
            const left = this.$el.children[0].offsetLeft,
                    right = left + this.$el.children[0].clientWidth,
                    top = this.$el.children[0].offsetTop,
                    bottom = top + this.$el.children[0].clientHeight;
            const MARGIN = 12;

            const resizeVer = Math.abs(right - e.clientX) < MARGIN &&
                              e.clientY >= top && e.clientY <= bottom;
            const resizeHor = Math.abs(bottom - e.clientY) < MARGIN &&
                              e.clientX >= left && e.clientX <= right;

            let cursor = "";

            if (this.split === "vertical" && resizeVer) cursor = "ew-resize";
            if (this.split === "horizontal" && resizeHor) cursor = "ns-resize";

            if (cursor !== ""){
                this.canResize = true;
                Mouse.setCursor(cursor);
            }else{
                this.canResize = false;
                Mouse.clearCursor(this.split === "vertical" ? "ew-resize" : "ns-resize");
            }
            
          }
      }
    },

    watch: {
        panel0Style: {
            deep: true,
            handler: function (val) {
                this.updateStyle(this.$el.children[0], val);
            }
        },
        panel1Style: {
            deep: true,
            handler: function (val) {
                this.updateStyle(this.$el.children[1], val);
            }
        }
    }
}
</script>

<style scoped>

</style>