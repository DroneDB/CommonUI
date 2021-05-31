<template>
    <div class="markdown">
        <Message bindTo="error" />
        <div v-if="loading" class="loading">
            <i class="icon circle notch spin" />
        </div>
        <div v-else>

        
        <sui-tab>
            <sui-tab-pane title="Preview">
                <div v-html="res" class="content" />
            </sui-tab-pane>
            <sui-tab-pane title="Content">
                <textarea :value="content" @input="update"></textarea>
            </sui-tab-pane>
        </sui-tab>                   
            
        </div>

    </div>
</template>

<script>
import Message from './Message';
import ddb from 'ddb';
import MarkdownIt from 'markdown-it';
import _ from 'lodash';

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
          content: "",
          md: new MarkdownIt(),
          res: null
      }
  },

  computed: {
    compiledMarkdown() {
      return marked(this.content, { sanitize: true });
    }
  },
  methods: {
    update: _.debounce(function(e) {
      this.res = this.md.render(e.target.value);
      this.content = e.target.value;
    }, 300)
  },

  mounted: async function(){
      const [dataset, path] = ddb.utils.datasetPathFromUri(this.uri);
      try{
        const res = await dataset.getFileContents(path);

        this.content = res;
        this.res = this.md.render(this.content);
        
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

#editor {
  margin: 0;
  height: 100%;
  font-family: "Helvetica Neue", Arial, sans-serif;
  color: #333;
}

textarea,
#editor div {
  display: inline-block;
  width: 49%;
  height: 100%;
  vertical-align: top;
  box-sizing: border-box;
  padding: 0 20px;
}

textarea {
  border: none;
  border-right: 1px solid #ccc;
  resize: none;
  outline: none;
  background-color: #f6f6f6;
  font-size: 14px;
  font-family: "Monaco", courier, monospace;
  padding: 20px;
}

code {
  color: #f66;
}
</style>