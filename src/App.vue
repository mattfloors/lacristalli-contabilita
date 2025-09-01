<script setup>
import AccountingsPage from "./AccountingsPage.vue";
</script>

<template>
  <div class="p-10">
    <AccountingsPage />
  </div>
</template>

<script>
import AccountingsPage from "./AccountingsPage.vue";
export default {
  name: "App",
  components: {
    AccountingsPage,
  },
};
</script>