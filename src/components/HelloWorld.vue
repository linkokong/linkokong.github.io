<script setup>
import { ref,computed } from 'vue'
import { NDataTable,NTabs,NTabPane,NInput,NSpace,darkTheme,NConfigProvider} from 'naive-ui'
import {middle_1 } from '../dictionary/middle_1'
import {middle_2 } from '../dictionary/middle_2'
import {primary_1 } from '../dictionary/primary_1'
import {primary_2 } from '../dictionary/primary_2'
import {n2 } from '../dictionary/n2'

const words={middle_1,middle_2,primary_1,primary_2,n2}

const columns = ref([
  {title: "", key: "no"},
  {title: "カタカナ", key: "kana"},
  {title: "漢字", key: "kanji"},
  {title: "中文", key: "chinese"},
]);
const chapValue=ref('primary_2')


const wordlist=computed({
  get:()=>{
    if(filterKeyword.value){
      return words[chapValue.value]?.filter(item=>{
        let letter_t=item.kana+item.kanji+item.chinese
        if(letter_t.indexOf(filterKeyword.value)>-1){
          return item
        }
      })||[]
    }
    return words[chapValue.value]
  },
  set:(val)=>{}
})

let filterKeyword=ref(null)

let theme =ref(darkTheme)
let table_scroll=(Event)=>{
  console.log(Event)
}
</script>

<template>

    <n-space vertical>
      <n-tabs type="segment" v-model:value="chapValue">
        <n-tab-pane name="primary_1" tab="初级上">
        </n-tab-pane>
        <n-tab-pane name="primary_2" tab="初级下">
        </n-tab-pane>
        <n-tab-pane name="middle_1" tab="中级上">
        </n-tab-pane>
        <n-tab-pane name="middle_2" tab="中级下">
        </n-tab-pane>
        <n-tab-pane name="n2" tab="N2">
        </n-tab-pane>
      </n-tabs>
    </n-space>



  <n-space vertical>
      <n-input v-model:value="filterKeyword" type="text" tex align='left' placeholder="查询"/>
  </n-space>


  <n-config-provider :theme="theme">
  <n-space style='padding-top:5px'>
      <n-data-table
        :columns="columns"
        :data="wordlist"
        virtual-scroll
        :max-height="1000"
        size='small'
        striped
        :single-line='false'
        @on-scroll='table_scroll'
      />
  </n-space>
  </n-config-provider>
</template>

