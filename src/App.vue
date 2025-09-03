

<script>
import { defineAsyncComponent } from 'vue';
mount();
export default {
  name: "App",
  components: {
    AccountingsPage: defineAsyncComponent(() => import("./AccountingsPage.vue")),
  },
};
</script>