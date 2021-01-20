<template>
    <div class="buttons">
        <div v-for="t in tabs" class="tab-button" :class="{ active: activeTab === t.key, top: position === 'top' }" @click="setActiveTab(t)">
            <i class="icon" :class="t.icon" /> {{ t.label }}
        </div>
        <div v-if="buttonWidth === 'auto'" class="fill" :class="{ top: position === 'top', shadowed: lastTabSelected }">
        </div>
    </div>
</div>
</template>

<script>
export default {
  components: {
  },
  props: {
      tabs: {
          type: Array,
          required: true
      },
      defaultTab: {
          type: String,
          default: "",
      },
      position: {
          type: String,
          default: "bottom"
      },
      buttonWidth: {
          type: String,
          default: "expand" // one of "expand", "auto"
      }
  },
  data: function(){
      return {
          activeTab: this.defaultTab ? this.defaultTab : this.tabs[0].key
      };
  },
  computed: {
      lastTabSelected: function(){
          return this.tabs[this.tabs.length - 1].key === this.activeTab;
      }
  },
  mounted: function(){
  },
  methods: {
      setActiveTab: function(tab){
          this.activeTab = tab.key;
          this.$emit("click", tab);
      }
  }
}
</script>

<style scoped>
.buttons{
    margin-top: auto;
    display: flex;

    .fill, .tab-button{
        padding: 8px;
        text-align: center;
        border-top: 1px solid #000;
        &.top{
            border-top: none;
            border-bottom: 1px solid #000;
        }
    }
    .fill{
        flex-grow: 99;
        border-left: 1px solid #000;
        border-top: 1px solid #000;
        &.shadowed{
            box-shadow: inset 3px 0px 3px -3px;
        }
    }
    .tab-button {
        background-color: #eee;
        box-shadow: inset 0px 0px -3px 0px;
        border-top: 1px solid #000;
        &.top{
            box-shadow: inset 0px 0px 3px 0px;
            border-top: none;
            border-bottom: 1px solid #000;
        }
        
        &:first-child {
            box-shadow: inset -3px 3px 3px -3px;
            border-right: 1px solid #000;
        }

        flex-grow: 1;

        &:last-child {
            box-shadow: inset 3px 3px 3px -3px;
            border-left: 1px solid #000;
        }

        &:hover {
            cursor: pointer;
            background-color: #dadada;
        }

        &.active {
            box-shadow: none;
            border: none;
            background-color: #fefefe;

            &:hover {
                cursor: default;
            }

            &.top{
                box-shadow: none;
            }
        }
    }
}
</style>