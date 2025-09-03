<script>
    import { defineCustomElement } from 'vue';
import AccountingsPage from './App.vue';

    const VueRemoteWebComponent = defineCustomElement(AccountingsPage);

    customElements.define("vue-remote-web-component", VueRemoteWebComponent);

    export default VueRemoteWebComponent;
</script>