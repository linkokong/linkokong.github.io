<script setup>
import { ref,computed } from 'vue'
import { NDataTable,NTabs,NTabPane,NInput,NSpace,darkTheme,NConfigProvider} from 'naive-ui'
import {middle_1 } from '../dictionary/middle_1'
import {middle_2 } from '../dictionary/middle_2'
import {primary_1 } from '../dictionary/primary_1'
import {primary_2 } from '../dictionary/primary_2'
import {n2 } from '../dictionary/n2'
import {high_1 } from '../dictionary/high_1'
import {high_2 } from '../dictionary/high_2'

// ="  {'no':"&A2&",'kana':'"&B2&"','kanji':'"&C2&"','part':'','chinese':'"&D2&"'},"

const words={middle_1,middle_2,primary_1,primary_2,n2,high_1,high_2}

const columns = ref([
  {title: "", key: "no",width:50,className:'column-class'},
  {title: "かな", key: "kana",className:'column-class'},
  {title: "漢字", key: "kanji",className:'column-class'},
  {title: "中文", key: "chinese",className:'column-class'},
]);
const chapValue=ref('primary_2')


const wordlist=computed({
  get:()=>{
    if(filterKeyword.value){
      return [...middle_1,...middle_2,...primary_1,...primary_2,...n2,...high_1,...high_2]?.filter(item=>{
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
        <n-tab-pane name="primary_1" tab="初上">
        </n-tab-pane>
        <n-tab-pane name="primary_2" tab="初下">
        </n-tab-pane>
        <n-tab-pane name="middle_1" tab="中上">
        </n-tab-pane>
        <n-tab-pane name="middle_2" tab="中下">
        </n-tab-pane>
        <n-tab-pane name="n2" tab="N2">
        </n-tab-pane>
        <n-tab-pane name="high_1" tab="高上">
        </n-tab-pane>
        <n-tab-pane name="high_2" tab="高下">
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

<style>
.column-class{
  font-size:12px !important;
}
td[data-col-key='chinese']{
  color:#f46666 !important;
  font-size:10px !important;
}
</style>
