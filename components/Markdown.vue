<template>
    <div class="markdown">
        <Message bindTo="error" />
        <div v-if="loading" class="loading">
            <i class="icon circle notch spin" />
        </div>
        <Toolbar :tools="tools" ref="toolbar" />
        <Panel split="vertical" class="container main" amount="30%">
            <textarea :value="content" @input="update"></textarea>
            <div v-html="res" class="content" />
        </Panel>
    </div>
</template>

<script>
import Message from './Message';
import ddb from 'ddb';
import MarkdownIt from 'markdown-it';
import _ from 'lodash';
import Panel from 'commonui/components/Panel.vue';
import Toolbar from './Toolbar.vue';

export default {
  components: {
      Message,
      Panel,
      Toolbar
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
          res: null,
          tools: [
            {
                id: 'save',
                title: "Save",
                icon: "save",                
                onClick: () => {
                    this.$emit('onSave', this.content);
                }
            }            
        ],
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
    }, 300),

    refresh: async function(){
      this.loading = true;

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
  },

  mounted: async function(){
      
      await this.refresh();

      this.$root.$on('refreshMarkdown', async (uri) => {

        if (this.uri !== uri) return;
        this.$log.info("refreshMarkdown(uri)", uri);

        await this.refresh();
          
      });


  }
}
</script>

<style>
.markdown{
    height: 100%;
    position: relative;
    .content{
        border-left: 1px solid #030A03; 
        height: 100%; 
        overflow: scroll;
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
  background-color: white;/*#f6f6f6;*/
  font-size: 14px;
  font-family: "Monaco", courier, monospace;
  padding: 20px;
}

code {
  color: #f66;
}
</style>