import { createApp } from "vue";
import PrimeVue from "primevue/config";
import App from "./App.vue";
import "./css/custom.css";
import "./css/base.css";
import "primeicons/primeicons.css";
import "primevue/resources/themes/aura-light-green/theme.css";
import Lara from "./presets/lara";

const app = createApp(App);
app.use(PrimeVue, {
  unstyled: true,
  pt: Lara,
});

app.mount("#app");