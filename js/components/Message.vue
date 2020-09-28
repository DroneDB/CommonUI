<template>
    <div v-if="$parent[bindTo]" class="alert alert-dismissible show" :class="className" role="alert">
        <button type="button" class="close" aria-label="Close">
            <span aria-hidden="true" @click="dismiss">&times;</span>
        </button>
        <span v-html="$parent[bindTo]" />
    </div>
</template>

<script>
export default {
  props: {
      bindTo: {
          type: String,
          default: "message"
      },
      className: {
          type: String,
          default: "alert-success"
      }
  },
  methods: {
      dismiss: function(){
          this.$parent[this.bindTo] = "";
      }
  }
}
</script>

<style scoped>
</style>