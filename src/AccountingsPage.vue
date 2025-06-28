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

const accountings = ref(data.data.data);

const statuses = [
  { name: "In corso", code: "pending" },
  { name: "Completato", code: "completed" },
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
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">123.00€</p>
        <p class="text-sm">Venduto</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">123.00€</p>
        <p class="text-sm">Provvigioni</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">12</p>
        <p class="text-sm">In corso</p>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">12</p>
        <p class="text-sm">Completati</p>
      </div>
    </div>

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

    <div>
      <DataTable :value="accountingsFiltered" tableStyle="min-width: 50rem">
        <Column header="Agente">
          <template #body="slotProps">
            <p>{{ slotProps.data.insurer.full_name ?? "-" }}</p>
          </template>
        </Column>
        <Column header="Stato">
          <template #body="slotProps">
            <div
              :class="{
                'px-2 py-1 rounded-full text-sm text-center w-32': true,
                'bg-green-500 text-white':
                  slotProps.data.status === 'completed',
                'bg-yellow-500 text-white': slotProps.data.status === 'pending',
              }"
            >
              <p>{{
                slotProps.data.status === "completed"
                  ? "Completato"
                  : "In corso"
              }}</p>
            </div>
          </template>
        </Column>
        <Column field="sold_price" header="Venduto">
          <template #body="slotProps">
            <p>{{ priceFormatted(slotProps.data.sold_price) }}</p>
          </template>
        </Column>
        <Column field="revenue" header="Provvigione">
          <template #body="slotProps">
            <p>{{ priceFormatted(slotProps.data.revenue) }}</p>
          </template>
        </Column>
        <Column field="revenue_indirect" header="Provvigione dai prospect">
          <template #body="slotProps">
            <p>{{ priceFormatted(slotProps.data.revenue_indirect) }}</p>
          </template>
        </Column>
        <Column field="invoiced_at" header="Fatturato il">
          <template #body="slotProps">
            <p>{{
              slotProps.data.invoiced_at?.toLocaleDateString("it-IT") ?? "-"
            }}</p>
          </template>
        </Column>
        <Column field="paid_at" header="Pagato il">
          <template #body="slotProps">
            <p>{{
              slotProps.data.paid_at?.toLocaleDateString("it-IT") ?? "-"
            }}</p>
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
              <Button
                @click="
                  () => {
                    modelToFile = slotProps.data;
                    fileModal = true;
                  }
                "
                icon="pi pi-file"
                aria-label="File"
                severity="info"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="editModal"
      modal
      header="Modifica"
      :style="{ width: '45rem' }"
    >
      <div class="grid sm:grid-cols-2 gap-2 py-2">
        <div>
          <label for="insurer" class="font-bold block mb-2">Stato</label>
          <Dropdown
            v-model="modelToEdit.status"
            :options="statuses"
            optionLabel="name"
            optionValue="code"
            placeholder="Scegli lo stato"
            class="w-full"
          />
        </div>
        <div>
          <label for="sold_price" class="font-bold block mb-2">Venduto</label>
          <InputNumber
            v-model="modelToEdit.sold_price"
            :min="0"
            :maxFractionDigits="2"
            inputId="sold_price"
            mode="currency"
            currency="EUR"
            class="w-full"
          />
        </div>
        <div>
          <label for="revenue" class="font-bold block mb-2">Provvigione</label>
          <InputNumber
            v-model="modelToEdit.revenue"
            :min="0"
            :maxFractionDigits="2"
            inputId="revenue"
            mode="currency"
            currency="EUR"
            class="w-full"
          />
        </div>
        <div>
          <label for="revenue_indirect" class="font-bold block mb-2">
            Provvigione dai prospect
          </label>
          <InputNumber
            v-model="modelToEdit.revenue_indirect"
            :min="0"
            :maxFractionDigits="2"
            inputId="revenue_indirect"
            mode="currency"
            currency="EUR"
            class="w-full"
          />
        </div>
        <div>
          <label for="invoiced_at" class="font-bold block mb-2"
            >Fatturato il
          </label>
          <Calendar
            v-model="modelToEdit.invoiced_at"
            dateFormat="dd/mm/yy"
            placeholder="Scegli la data"
            class="w-full"
          />
        </div>
        <div>
          <label for="paid_at" class="font-bold block mb-2">Pagato il</label>
          <Calendar
            v-model="modelToEdit.paid_at"
            dateFormat="dd/mm/yy"
            placeholder="Scegli la data"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Annulla" severity="outline" @click="editModal = false" />
        <Button label="Salva" severity="info" @click="save" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="fileModal"
      modal
      header="Gestisci i file"
      :style="{ width: '45rem' }"
    >
      <div>
        <p class="font-bold">File presenti</p>
        <div class="flex flex-col gap-2 py-2">
          <div v-for="file in modelToFile.docs" :key="file.id">
            <a :href="file.url" target="_blank">
              <i class="pi pi-file mr-2" style="font-size: 1rem"></i>
              <span>{{ file.file_name ?? "Nome file non disponibile" }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <p class="font-bold">Carica file</p>
        <FileUpload
          v-model="filesToUpload"
          mode="basic"
          name="filesToUpload"
          :multiple="true"
          accept="application/pdf"
          @upload="uploadFile"
        />
      </div>
      <template #footer>
        <Button label="Annulla" severity="outline" @click="fileModal = false" />
        <Button label="Carica" severity="info" @click="uploadFile" />
      </template>
    </Dialog>
  </div>
</template>
