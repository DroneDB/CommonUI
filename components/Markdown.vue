<template>
    <div class="markdown">
        <Message bindTo="error" />
        <div v-if="loading" class="loading">
            <i class="icon circle notch spin" />
        </div>
        <div v-else v-html="content" class="content" />
    </div>
</template>

<script>
import Message from './Message';
import ddb from 'ddb';
import MarkdownIt from 'markdown-it';

export default {
  components: {
      Message
  },
  props: {
      uri: { // DDB uri
          type: String,
          required: true
      }
  },
  data: function(){
      return {
          loading: true,
          error: "",
          content: ""
      }
  },

  mounted: async function(){
      const [dataset, path] = ddb.utils.datasetPathFromUri(this.uri);
      try{
        const res = await dataset.getFileContents(path);
        const md = new MarkdownIt();
        this.content = md.render(res);
      }catch(e){
        this.error = `Cannot fetch ${this.uri}: ${e}`;
      }
      this.loading = false;
  }
}
</script>

<style>
.markdown{
    .content{
        padding: 12px;
        img{
            max-width: 100%;
        }
    }
}
</style>