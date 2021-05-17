<template>
  <PageContainer />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageContainer from "./components/PageContainer.vue";

export default defineComponent({
  name: "App",
  components: {
    PageContainer,
  }
});
</script>

<style>
body {
  margin: 0;
}

#app {
  width: 100vw;
  height: 100vh;
  background: #ffffff;
}

a {
  color: #459da6;
}

</style>
