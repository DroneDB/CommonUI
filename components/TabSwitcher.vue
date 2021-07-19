<template>
<div class="tab-switcher">
    <TabButtons :tabs="dynTabs"
                :defaultTab="activeTab"
                :position="position"
                :buttonWidth="buttonWidth"
                v-if="position === 'top' && (!hideSingle || dynTabs.length > 1)" @click="setActiveTab" />
    <div class="tabs">
        <div class="tab" v-for="t in dynTabs" :class="{hide: t.key !== activeTab}">
            <slot :name="t.key" />
        </div>
    </div>
    <TabButtons :tabs="dynTabs"
                :defaultTab="activeTab"
                :position="position"
                :buttonWidth="buttonWidth"
                v-if="position === 'bottom' && (!hideSingle || dynTabs.length > 1)" @click="setActiveTab"/>
</div>
</template>

<script>
import { clone } from '../classes/utils';
import TabButtons from './TabButtons';

export default {
  components: {
      TabButtons
  },
  props: {
      tabs: {
          type: Array,
          required: true
      },
      hideSingle: {
          type: Boolean,
          default: false
      },
      position: {
          type: String,
          default: "bottom" // one of "bottom", "top"
      },
      buttonWidth: {
          type: String,
          default: "expand" // one of "expand", "auto"
      }
  },
  data: function(){
      return {
          activeTab: this.tabs[0].key,
          dynTabs: clone(this.tabs)
      };
  },
  mounted: function(){
  },
  methods: {
      setActiveTab: function(tab){
          this.activeTab = tab.key;

          const tag = this.$slots[tab.key][0].tag;
          const node = this.$children.find(c => c.$vnode.tag === tag);

          if (node.onTabActivated !== undefined){
              node.onTabActivated();
          }
      },

      addTab: function(tab, activate = true, prepend = false){
          if (this.$slots[tab.key]) this.removeTab(tab.key);

          const node = this.$createElement(tab.component, {
               props: tab.props
          });

          this.$slots[tab.key] = [node];
          
          const tabDef = {
                label: tab.label,
                icon: tab.icon,
                key: tab.key,
                hideLabel: tab.hideLabel
          };

          if (prepend){
              this.dynTabs.unshift(tabDef);
          }else{
              this.dynTabs.push(tabDef);
          }

          if (activate){
            this.setActiveTab(tab);
            this.$forceUpdate();
          }
      },

      removeTab: function(tabKey){
          const tabIndex = this.dynTabs.findIndex(t => t.key === tabKey);
          if (tabIndex !== -1){
            let tabToActivate = tabIndex - 1;

            // Last tab?
            if (tabToActivate < 0){
                tabToActivate = 0;
            }

            // No tabs left after?
            if (this.dynTabs.length === 1){
                tabToActivate = -1;
            }

            // Remove
            this.dynTabs = this.dynTabs.filter(t => t.key !== tabKey);

            if (tabToActivate !== -1){
                this.setActiveTab(this.dynTabs[tabToActivate]);
            }
          }else{
              console.warn(`Cannot remove tab with key: ${tabKey}`);
          }
          
      }
  }
}
</script>

<style scoped>
.tab-switcher{
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;

    .tabs {
        height: 100%;
        overflow: hidden;

        .tab {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: auto;
        }
    }

}
</style>