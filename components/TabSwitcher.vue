<template>
<div class="tab-switcher">
    <div class="tabs">
        <div class="tab" v-for="t in tabs" :class="{hide: t.key !== activeTab}">
            <slot :name="t.key" />
        </div>
    </div>
    <div class="buttons">
        <div v-for="t in tabs" class="tab-button" :class="{ active: activeTab === t.key }" @click="setActiveTab(t)">
            <i class="icon" :class="t.icon" /> {{ t.label }}
        </div>
    </div>
</div>
</template>

<script>
export default {
  components: {
  },
  props: ['tabs'],
  data: function(){
      return {
          activeTab: (this.tabs[0] || {}).key
      };
  },
  mounted: function(){
  },
  methods: {
      setActiveTab: function(tab){
          this.activeTab = tab.key;
      }
  }
}
</script>

<style scoped>
</style>