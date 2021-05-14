<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'iwallpaper'
  }
</script>

<style>
  /* CSS 隐藏滚动条*/
  ::-webkit-scrollbar {
    display: none;
    /* Chrome Safari */
  }
  
</style>