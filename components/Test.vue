<template>
    <div>
    Hello, {{ user }}
    </div>
</template>

<script>
export default {
  props: {
      user: {
          type: String,
          default: "?"
      }
  }
}
</script>

<style scoped>
</style>