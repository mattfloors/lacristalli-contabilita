<script>
    import { defineCustomElement } from 'vue';
import AccountingsPage from './AccountingsPage.vue';

    const VueRemoteWebComponent = defineCustomElement(AccountingsPage);

    customElements.define("vue-remote-web-component", VueRemoteWebComponent);

    export default VueRemoteWebComponent;
</script>