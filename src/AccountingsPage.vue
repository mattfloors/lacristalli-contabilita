<script setup>
import { ref, computed } from "vue";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Calendar from "primevue/calendar";
import data from "./data/data.json";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import FileUpload from "primevue/fileupload";
import Textarea from "primevue/textarea";

const accountings = ref(data.data.data);

const statuses = [
  { name: "In attesa", code: "pending" }, // yellow
  { name: "Incassato", code: "collected" }, // blue
  { name: "Pagato", code: "paid" }, // red
  { name: "Incassato e pagato", code: "collected_and_paid" }, // green
];

const filters = ref({
  search: null,
  status: null,
  date: new Date(new Date().setHours(12, 0, 0, 0)),
});

const accountingsFiltered = computed(() => {
  let filtered = accountings.value;

  if (filters.value.search) {
    filtered = filtered.filter((accounting) => {
      return accounting.insurer.full_name
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());
    });
  }

  if (filters.value.status) {
    filtered = filtered.filter((accounting) => {
      return accounting.status === filters.value.status;
    });
  }

  if (filters.value.date) {
    filtered = filtered.filter((accounting) => {
      console.log(
        accounting.month,
        (filters.value.date.getMonth() + 1).toString(),
        accounting.year,
        filters.value.date.getFullYear().toString()
      );
      return (
        accounting.month * 1 === filters.value.date.getMonth() + 1 &&
        accounting.year * 1 === filters.value.date.getFullYear()
      );
    });
  }

  console.log(accountings.value);

  return filtered;
});

const priceFormatted = (price) => {
  return price.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
};

const editModal = ref(false);

const modelToEdit = ref(null);
const save = () => {
  console.log(modelToEdit.value);
  editModal.value = false;
  modelToEdit.value = null;
};

const fileModal = ref(false);
const modelToFile = ref(null);
const filesToUpload = ref([]);
const uploadFile = () => {
  console.log(filesToUpload.value);
  fileModal.value = false;
  filesToUpload.value = [];
};
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="flex gap-2">
      <InputText type="text" v-model="filters.search" placeholder="Cerca" />

      <Dropdown
        v-model="filters.status"
        :options="statuses"
        optionLabel="name"
        optionValue="code"
        placeholder="Tutti"
        class="w-56"
        showClear
      />

      <Calendar
        v-model="filters.date"
        view="month"
        dateFormat="mm/yy"
        placeholder="Scegli il mese"
      />
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">123.00€</p>
        <p class="text-sm">Incassi mancanti</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">11</p>
        <p class="text-sm">Assicuratori di cui manca l'incasso</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">123.00€</p>
        <p class="text-sm">Provvigioni da pagare</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">12</p>
        <p class="text-sm">Assicuratori da pagare</p>
      </div>
    </div>

    <div>
      <DataTable :value="accountingsFiltered" tableStyle="min-width: 50rem">
        <Column header="Agente">
          <template #body="slotProps">
            <p>{{ slotProps.data.insurer.full_name ?? "-" }}</p>
          </template>
        </Column>
        <Column header="Stato">
          <template #body="slotProps">
            <p
              :class="{
                'px-2 py-1 rounded-md text-center': true,
                'bg-yellow-100 text-yellow-600':
                  slotProps.data.status === 'pending',
                'bg-blue-100 text-blue-600':
                  slotProps.data.status === 'collected',
                'bg-red-100 text-red-600': slotProps.data.status === 'paid',
                'bg-green-100 text-green-600':
                  slotProps.data.status === 'collected_and_paid',
              }"
              >{{
                statuses.find((status) => status.code === slotProps.data.status)
                  ?.name ?? "-"
              }}</p
            >
          </template>
        </Column>
        <Column field="sold_price" header="Incassi">
          <template #body="slotProps">
            <p class="text-lg font-bold">
              {{ priceFormatted(slotProps.data.sold_price) }}
            </p>
            <p class="text-xs text-gray-400">{{ "07/07/2025" }}</p>
            <p class="text-xs text-gray-400">{{ "N123321 - 07/07/2025" }}</p>
          </template>
        </Column>
        <Column field="revenue" header="Provvigione">
          <template #body="slotProps">
            <p class="text-lg font-bold">
              {{ priceFormatted(slotProps.data.revenue) }}
            </p>
            <p class="text-sm text-gray-400">{{
              priceFormatted(slotProps.data.revenue)
            }}</p>
            <p class="text-xs text-gray-400">{{ "07/07/2025" }}</p>
            <p class="text-xs text-gray-400">{{ "N123321 - 07/07/2025" }}</p>
          </template>
        </Column>
        <Column field="note" header="Note">
          <template #body="slotProps">
            <p class="text-xs">Note</p>
          </template>
        </Column>
        <Column header="Azioni">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                @click="
                  () => {
                    modelToEdit = slotProps.data;
                    editModal = true;
                  }
                "
                icon="pi pi-pencil"
                aria-label="Modifica"
                severity="success"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="editModal"
      modal
      :header="`${modelToEdit?.insurer?.full_name ?? ''}`"
      :style="{ width: '45rem' }"
    >
      <div class="flex flex-col gap-10">
        <div class="flex flex-col gap-2">
          <h1 class="font-bold w-full bg-red-100 px-2 py-1 rounded-md">
            Provvigioni
          </h1>
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label for="invoiced_at" class="block mb-2"
                >Importo imponibile fattura</label
              >
              <InputNumber
                disabled
                class="w-full"
                :min="0"
                v-model="modelToEdit.revenue"
              />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2">Importo pagato</label>
              <InputNumber
                class="w-full"
                v-model="modelToEdit.paid_amount"
                :min="0"
              />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2">Numero fattura</label>
              <InputText class="w-full" v-model="modelToEdit.invoice_number" />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2">Data fattura</label>
              <Calendar
                v-model="modelToEdit.invoiced_at"
                dateFormat="dd/mm/yy"
                placeholder="Scegli la data"
                class="w-full"
              />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2"
                >Conto di pagamento fattura</label
              >
              <Dropdown
                v-model="modelToEdit.payment_account"
                :options="['FIDEURAM', 'MPS', 'FINECO']"
                placeholder="Scegli uno"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h1 class="font-bold w-full bg-green-100 px-2 py-1 rounded-md">
            Incassi
          </h1>
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label for="invoiced_at" class="block mb-2"
                >Importo lordo incasso dovuto</label
              >
              <InputNumber
                disabled
                class="w-full"
                :min="0"
                v-model="modelToEdit.sold_price"
              />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2"
                >Data ricezione incasso</label
              >
              <Calendar
                v-model="modelToEdit.collected_at"
                dateFormat="dd/mm/yy"
                placeholder="Scegli la data"
                class="w-full"
              />
            </div>
            <div>
              <label for="invoiced_at" class="block mb-2"
                >Conto di pagamento fattura</label
              >
              <Dropdown
                v-model="modelToEdit.payment_account_collected"
                :options="['FIDEURAM', 'MPS', 'FINECO']"
                placeholder="Scegli uno"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h1 class="font-bold w-full bg-slate-200 px-2 py-1 rounded-md">
            Note
          </h1>
          <div class="flex flex-col gap-2 mt-2">
            <Textarea
              v-model="modelToEdit.note"
              autoResize
              rows="5"
              cols="30"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h1 class="font-bold w-full bg-slate-200 px-2 py-1 rounded-md">
            File presenti
          </h1>
          <div class="flex flex-col gap-2 mt-2">
            <div v-for="file in modelToEdit.docs" :key="file.id">
              <a :href="file.url" target="_blank">
                <i class="pi pi-file mr-2" style="font-size: 1rem"></i>
                <span>{{ file.file_name ?? "Nome file non disponibile" }}</span>
              </a>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h1 class="font-bold w-full bg-slate-200 px-2 py-1 rounded-md">
            Carica file
          </h1>
          <div class="flex flex-col gap-2 mt-2">
            <FileUpload
              v-model="filesToUpload"
              mode="basic"
              name="filesToUpload"
              :multiple="true"
              accept="application/pdf"
              @upload="uploadFile"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Annulla" severity="outline" @click="editModal = false" />
        <Button label="Salva" severity="info" @click="save" />
      </template>
    </Dialog>
  </div>
</template>
