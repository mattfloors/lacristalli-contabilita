

<template>
  <div class="p-10">
    <AccountingsPage />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  name: "App",
  components: {
    AccountingsPage: defineAsyncComponent(() => import("./AccountingsPage.vue")),
  },
};
</script>