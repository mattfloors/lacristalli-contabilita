<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Paginator from "primevue/paginator";
import Toast from "primevue/toast";
import FileUpload from "primevue/fileupload";

// API Configuration for Laravel backend
const API_BASE_URL = "https://185.181.8.206/api";

// Get token from localStorage or use fallback for testing
const getAuthToken = () => {
  const localStorageToken = localStorage.getItem("token");
  if (localStorageToken) {
    return localStorageToken;
  }
  // Fallback token for testing - remove in production
  return "3268|gomvcQ4ZZsthkcC4WMAn8EFStGKdPTd3OfBKsSZoa22ade7d";
};

// Configure axios defaults for Laravel
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common["Authorization"] = `Bearer ${getAuthToken()}`;
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Reactive data
const accountings = ref([]);
const loading = ref(false);
const totalRecords = ref(0);
const currentPage = ref(1);
const rowsPerPage = ref(15);

// Status options for filter
const statuses = [
  { name: "In attesa", code: "pending" },
  { name: "Incassato", code: "collected" },
  { name: "Pagato", code: "paid" },
  { name: "Incassato e pagato", code: "collected_paid" },
];

// Pagination options
const paginationOptions = [
  { label: "15", value: 15 },
  { label: "50", value: 50 },
  { label: "Tutti", value: 9999 },
];

// Filters
const filters = ref({
  search: null,
  status: [],
  dateFrom: new Date(new Date().setHours(12, 0, 0, 0)),
  dateTo: null,
});

// Modal state
const editModal = ref(false);
const modelToEdit = ref(null);
const revenueCalculationType = ref("manual");

// Toast state
const toast = ref();

// Save loading state
const isSaving = ref(false);

// Files to upload
const filesToUpload = ref([]);

// Statistics computed from filtered data
const statistics = computed(() => {
  const filteredData = accountings.value;

  // Calculate missing collections: difference between sold_real and sold_price for pending/paid records
  const pendingAndPaidRecords = filteredData.filter(
    (item) => item.status === "pending" || item.status === "paid"
  );

  const missingCollections = pendingAndPaidRecords.reduce((sum, item) => {
    const soldReal = item.sold_real || 0;
    const soldPrice = item.sold_price || 0;
    return sum + (soldReal - soldPrice);
  }, 0);

  const missingCollectionsCount = filteredData.filter(
    (item) => item.status !== "collected" && item.status !== "collected_paid"
  ).length;

  const missingPayments = filteredData.filter(
    (item) => item.status !== "paid" && item.status !== "collected_paid"
  );

  const totalMissingPayments = missingPayments.reduce(
    (sum, item) => sum + (item.revenue_real || 0),
    0
  );

  return {
    missingCollections: missingCollections,
    missingCollectionsCount: missingCollectionsCount,
    missingPayments: totalMissingPayments,
    missingPaymentsCount: missingPayments.length,
  };
});

// Format price to Italian currency
const priceFormatted = (price) => {
  if (!price) return "0,00 €";
  return price.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
};

// Truncate text for note preview
const truncateText = (text, maxLength = 30) => {
  if (!text) return "-";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Format date to dd/mm/yyyy
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Fetch accountings data from API
const fetchAccountings = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      per_page: rowsPerPage.value,
    };

    // Add filters to params
    if (filters.value.search) {
      params.search = filters.value.search;
    }

    if (filters.value.status && filters.value.status.length > 0) {
      params.status = filters.value.status.join(",");
    }

    if (filters.value.dateFrom) {
      params.start_month = (filters.value.dateFrom.getMonth() + 1).toString();
      params.start_year = filters.value.dateFrom.getFullYear().toString();
    }

    if (filters.value.dateTo) {
      params.end_month = (filters.value.dateTo.getMonth() + 1).toString();
      params.end_year = filters.value.dateTo.getFullYear().toString();
    }

    const response = await axios.get("/accountings", { params });

    if (response.data.error === false) {
      // Sort accountings by full_name alphabetically
      accountings.value = response.data.data.data.sort((a, b) => {
        const nameA = a.insurer?.full_name || "";
        const nameB = b.insurer?.full_name || "";
        return nameA.localeCompare(nameB, "it", { sensitivity: "base" });
      });
      totalRecords.value = response.data.data.total;
    }
  } catch (error) {
    console.error("Error fetching accountings:", error);
  } finally {
    loading.value = false;
  }
};

// Handle page change
const onPageChange = (event) => {
  currentPage.value = event.page + 1;
  fetchAccountings();
};

// Handle rows per page change
const onRowsPerPageChange = (event) => {
  rowsPerPage.value = event.value;
  currentPage.value = 1; // Reset to first page when changing rows per page
  fetchAccountings();
};

// Open edit modal
const openEditModal = (accounting) => {
  modelToEdit.value = { ...accounting };

  // Convert date strings to Date objects for the modal
  if (modelToEdit.value.sold_date) {
    modelToEdit.value.sold_date = new Date(modelToEdit.value.sold_date);
  }
  if (modelToEdit.value.invoice_date) {
    modelToEdit.value.invoice_date = new Date(modelToEdit.value.invoice_date);
  }

  revenueCalculationType.value = "manual"; // Reset to manual by default
  filesToUpload.value = []; // Reset files to upload
  editModal.value = true;
};

// Save changes
const saveChanges = async () => {
  isSaving.value = true;

  try {
    // Prepare form data for file upload
    const formData = new FormData();

    // Add all model data
    Object.keys(modelToEdit.value).forEach((key) => {
      if (key !== "docs") {
        // Exclude docs array from form data
        let value = modelToEdit.value[key];

        // Convert dates to Y-m-d format
        if (key === "invoice_date" || key === "sold_date") {
          if (value instanceof Date) {
            // Use local date to avoid timezone issues
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, "0");
            const day = String(value.getDate()).padStart(2, "0");
            value = `${year}-${month}-${day}`; // Format as Y-m-d
          }
        }

        // For FormData, send null as empty string but add a flag
        if (value === null || value === undefined) {
          formData.append(key, "");
          formData.append(`${key}_is_null`, "true");
        } else {
          formData.append(key, value);
        }
      }
    });

    // Add files if any
    if (filesToUpload.value && filesToUpload.value.length > 0) {
      filesToUpload.value.forEach((file) => {
        formData.append("files[]", file);
      });
    }

    const response = await axios.post(
      `/accountings/${modelToEdit.value.id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.error === false) {
      // Success - show green toast and close modal
      toast.value.add({
        severity: "success",
        summary: "Successo",
        detail: "Dati salvati",
        life: 3000,
      });

      // Close modal and refresh data
      editModal.value = false;
      modelToEdit.value = null;
      revenueCalculationType.value = "manual";
      filesToUpload.value = [];

      // Refresh the data
      fetchAccountings();
    } else {
      // API returned error
      toast.value.add({
        severity: "error",
        summary: "Errore",
        detail: "Si è verificato un errore!",
        life: 5000,
      });
    }
  } catch (error) {
    console.error("Error saving accounting:", error);

    // Show error toast
    toast.value.add({
      severity: "error",
      summary: "Errore",
      detail: "Si è verificato un errore!",
      life: 5000,
    });
  } finally {
    isSaving.value = false;
  }
};

// Reset all filters
const resetFilters = () => {
  filters.value.search = null;
  filters.value.status = [];
  filters.value.dateFrom = new Date(new Date().setHours(12, 0, 0, 0));
  filters.value.dateTo = null;
};

// Set filters for missing collections
const setFiltersForMissingCollections = () => {
  filters.value.status = ["pending", "paid"];
};

// Set filters for missing payments
const setFiltersForMissingPayments = () => {
  filters.value.status = ["pending", "collected"];
};

// Handle revenue calculation type change
const onRevenueCalculationTypeChange = (event) => {
  const selectedType = event.value;

  // Reset revenue when changing calculation type
  if (selectedType !== "manual") {
    modelToEdit.value.revenue = modelToEdit.value.revenue_real;
  }

  // TODO: Add calculation formulas based on selected type
  // This is where you will add the specific calculation logic
  switch (selectedType) {
    case "ordinary_no_dep":
      // Add formula for "Ordinario senza dip."
      modelToEdit.value.revenue = (
        modelToEdit.value.revenue_real * 1.22 -
        (modelToEdit.value.revenue_real / 2) * 0.23
      ).toFixed(2);
      break;
    case "ordinary_with_dep":
      // Add formula for "Ordinario con dip."
      modelToEdit.value.revenue = (
        modelToEdit.value.revenue_real * 1.22 -
        (modelToEdit.value.revenue_real / 5) * 0.23
      ).toFixed(2);
      break;
    case "flat_rate":
      // Add formula for "Forfettario"
      modelToEdit.value.revenue = modelToEdit.value.revenue_real;
      break;
    case "manual":
    default:
      // Manual mode - user can edit revenue directly
      break;
  }
};

// Handle file selection
const onFileSelect = (event) => {
  // Manually update the filesToUpload array
  // Add new files to existing array instead of replacing
  filesToUpload.value = [...filesToUpload.value, ...event.files];
};

// Handle file clear
const onFileClear = () => {
  filesToUpload.value = [];
};

// Watch filters for reactive API calls (excluding search)
watch(
  () => [filters.value.status, filters.value.dateFrom, filters.value.dateTo],
  () => {
    currentPage.value = 1;
    fetchAccountings();
  }
);

// Watch search with debounce
watch(
  () => filters.value.search,
  () => {
    debouncedSearch();
  }
);

// Debounced search function
let searchTimeout = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAccountings();
  }, 300);
};

// Initialize data on component mount
onMounted(() => {
  fetchAccountings();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Toast Component -->
    <Toast ref="toast" />
    <!-- Filters Section -->
    <div class="flex gap-2 flex-wrap">
      <InputText
        type="text"
        v-model="filters.search"
        placeholder="Cerca assicuratore"
        class="w-64"
      />

      <MultiSelect
        v-model="filters.status"
        :options="statuses"
        optionLabel="name"
        optionValue="code"
        placeholder="Tutti gli stati"
        class="w-56"
        :showClear="true"
        :showSelectAll="true"
        :showUnselectAll="true"
      />

      <Calendar
        v-model="filters.dateFrom"
        view="month"
        dateFormat="mm/yy"
        placeholder="Da mese"
      />
      <Calendar
        v-model="filters.dateTo"
        view="month"
        dateFormat="mm/yy"
        placeholder="A mese"
      />

      <Button
        @click="resetFilters"
        icon="pi pi-trash"
        aria-label="Resetta filtri"
        severity="primary"
      />
    </div>

    <!-- Status Legend -->
    <div class="flex gap-4 text-xs text-gray-600">
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full bg-yellow-100 border-2 border-yellow-300"
        ></div>
        <span>In attesa</span>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-300"
        ></div>
        <span>Incassato</span>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full bg-red-100 border-2 border-red-300"
        ></div>
        <span>Pagato</span>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full bg-green-100 border-2 border-green-300"
        ></div>
        <span>Incassato e pagato</span>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">{{
          priceFormatted(statistics.missingCollections)
        }}</p>
        <div class="flex justify-between items-center">
          <p class="text-sm">Incassi mancanti</p>
          <i
            class="pi pi-eye text-gray-500 hover:text-blue-600 cursor-pointer text-sm"
            @click="setFiltersForMissingCollections"
            title="Filtra per incassi mancanti"
          ></i>
        </div>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">{{
          statistics.missingCollectionsCount
        }}</p>
        <div class="flex justify-between items-center">
          <p class="text-sm">Assicuratori di cui manca l'incasso</p>
          <i
            class="pi pi-eye text-gray-500 hover:text-blue-600 cursor-pointer text-sm"
            @click="setFiltersForMissingCollections"
            title="Filtra per assicuratori con incasso mancante"
          ></i>
        </div>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">{{
          priceFormatted(statistics.missingPayments)
        }}</p>
        <div class="flex justify-between items-center">
          <p class="text-sm">Provvigioni da pagare</p>
          <i
            class="pi pi-eye text-gray-500 hover:text-blue-600 cursor-pointer text-sm"
            @click="setFiltersForMissingPayments"
            title="Filtra per provvigioni da pagare"
          ></i>
        </div>
      </div>
      <div
        class="bg-gray-100 p-4 rounded-lg h-28 flex flex-col justify-between"
      >
        <p class="text-4xl font-bold">{{ statistics.missingPaymentsCount }}</p>
        <div class="flex justify-between items-center">
          <p class="text-sm">Assicuratori da pagare</p>
          <i
            class="pi pi-eye text-gray-500 hover:text-blue-600 cursor-pointer text-sm"
            @click="setFiltersForMissingPayments"
            title="Filtra per assicuratori da pagare"
          ></i>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div>
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Righe per pagina:</span>
          <Dropdown
            v-model="rowsPerPage"
            :options="paginationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-40"
            @change="onRowsPerPageChange"
          />
        </div>
        <div class="text-sm text-gray-600">
          Totale record: {{ totalRecords }}
        </div>
      </div>

      <DataTable
        :value="accountings"
        :loading="loading"
        tableStyle="min-width: 50rem"
        :paginator="false"
      >
        <Column header="Nome assicuratore">
          <template #body="slotProps">
            <p>{{ slotProps.data.insurer?.full_name ?? "-" }}</p>
          </template>
        </Column>

        <Column header="Stato">
          <template #body="slotProps">
            <p
              :class="{
                'px-2 py-1 rounded-md text-center font-bold': true,
                'bg-yellow-100 text-yellow-600':
                  slotProps.data.status === 'pending',
                'bg-blue-100 text-blue-600':
                  slotProps.data.status === 'collected',
                'bg-red-100 text-red-600': slotProps.data.status === 'paid',
                'bg-green-100 text-green-600':
                  slotProps.data.status === 'collected_paid',
              }"
            >
              {{
                statuses.find((status) => status.code === slotProps.data.status)
                  ?.name ?? "-"
              }}
            </p>
          </template>
        </Column>

        <Column field="sold_real" header="Incassi" style="vertical-align: top">
          <template #body="slotProps">
            <div class="flex flex-col items-start">
              <p class="text-lg font-bold">
                {{ priceFormatted(slotProps.data.sold_real) }}
              </p>
              <div class="text-xs text-gray-400 space-y-1">
                <p v-if="slotProps.data.sold_price">
                  {{ priceFormatted(slotProps.data.sold_price) }}
                </p>
                <p v-if="slotProps.data.sold_date">
                  {{ formatDate(slotProps.data.sold_date) }}
                </p>
                <p v-if="slotProps.data.sold_account">
                  {{ slotProps.data.sold_account }}
                </p>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="revenue_real"
          header="Provvigione"
          style="vertical-align: top"
        >
          <template #body="slotProps">
            <div class="flex flex-col items-start">
              <p class="text-lg font-bold">
                {{ priceFormatted(slotProps.data.revenue_real) }}
              </p>
              <div class="text-xs text-gray-400 space-y-1">
                <p v-if="slotProps.data.revenue">
                  {{ priceFormatted(slotProps.data.revenue) }}
                </p>
                <p v-if="slotProps.data.invoice_date">
                  {{ formatDate(slotProps.data.invoice_date) }}
                </p>
                <p v-if="slotProps.data.invoice_number">
                  {{ slotProps.data.invoice_number }}
                </p>
                <p v-if="slotProps.data.invoice_account">
                  {{ slotProps.data.invoice_account }}
                </p>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="note"
          header="Note"
          style="min-width: 200px; max-width: 300px"
        >
          <template #body="slotProps">
            <p class="text-xs">{{ truncateText(slotProps.data.note) }}</p>
          </template>
        </Column>

        <Column header="Azioni">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                @click="openEditModal(slotProps.data)"
                icon="pi pi-pencil"
                aria-label="Modifica"
                severity="primary"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <Paginator
        :first="(currentPage - 1) * rowsPerPage"
        :rows="rowsPerPage"
        :totalRecords="totalRecords"
        @page="onPageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      />
    </div>

    <!-- Edit Modal -->
    <Dialog
      v-model:visible="editModal"
      modal
      :header="`${modelToEdit?.insurer?.full_name ?? ''}`"
      :style="{ width: '45rem' }"
    >
      <div class="flex flex-col gap-6">
        <!-- Provvigioni Section -->
        <div class="flex flex-col gap-4">
          <h3
            class="font-bold text-lg border-b px-2 py-1 bg-red-200 w-full rounded-lg flex justify-between"
          >
            Provvigioni
            <span>{{ priceFormatted(modelToEdit?.revenue_real ?? 0) }}</span>
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                Tipo calcolo provvigione
              </label>
              <Dropdown
                v-model="revenueCalculationType"
                :options="[
                  { label: 'Manuale', value: 'manual' },
                  { label: 'Ordinario senza dip.', value: 'ordinary_no_dep' },
                  { label: 'Ordinario con dip.', value: 'ordinary_with_dep' },
                  { label: 'Forfettario', value: 'flat_rate' },
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Scegli il tipo"
                class="w-full"
                @change="onRevenueCalculationTypeChange"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                Importo provvigione dovuta
              </label>
              <InputNumber
                v-model="modelToEdit.revenue"
                :min="0"
                class="w-full"
                :disabled="revenueCalculationType !== 'manual'"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                Numero fattura
              </label>
              <InputText
                v-model="modelToEdit.invoice_number"
                class="w-full"
                placeholder="Inserisci numero fattura"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                Data fattura
              </label>
              <Calendar
                v-model="modelToEdit.invoice_date"
                dateFormat="dd/mm/yy"
                placeholder="Scegli la data"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                Conto di pagamento fattura
              </label>
              <Dropdown
                v-model="modelToEdit.invoice_account"
                :options="['FIDEURAM', 'MPS', 'FINECO']"
                placeholder="Scegli il conto"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Incassi Section -->
        <div class="flex flex-col gap-4">
          <h3
            class="font-bold text-lg border-b px-2 py-1 bg-green-200 w-full rounded-lg flex justify-between"
          >
            Incassi
            <span>{{ priceFormatted(modelToEdit?.sold_real ?? 0) }}</span>
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2"
                >Importo netto incassato</label
              >
              <InputNumber
                v-model="modelToEdit.sold_price"
                :min="0"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2"
                >Data ricezione incasso</label
              >
              <Calendar
                v-model="modelToEdit.sold_date"
                dateFormat="dd/mm/yy"
                placeholder="Scegli la data"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2"
                >Conto di pagamento fattura</label
              >
              <Dropdown
                v-model="modelToEdit.sold_account"
                :options="['FIDEURAM', 'MPS', 'FINECO']"
                placeholder="Scegli il conto"
                class="w-full"
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Note Section -->
        <div class="flex flex-col gap-4">
          <h3
            class="font-bold text-lg border-b px-2 py-1 bg-gray-200 w-full rounded-lg"
          >
            Note
          </h3>
          <div>
            <Textarea
              v-model="modelToEdit.note"
              rows="10"
              class="w-full"
              placeholder="Inserisci le note..."
              autoResize
            />
          </div>
        </div>

        <!-- File Section -->
        <div class="flex flex-col gap-4">
          <h3
            class="font-bold text-lg border-b px-2 py-1 bg-blue-200 w-full rounded-lg"
          >
            File
          </h3>

          <!-- Existing Files -->
          <div>
            <h4 class="text-sm font-medium mb-2">File presenti:</h4>
            <div
              v-if="modelToEdit?.docs && modelToEdit.docs.length > 0"
              class="space-y-2"
            >
              <div
                v-for="file in modelToEdit.docs"
                :key="file.id"
                class="flex items-center gap-2 p-2 bg-gray-50 rounded border"
              >
                <i class="pi pi-file text-blue-500"></i>
                <a
                  :href="file.url"
                  target="_blank"
                  class="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  {{ file.file_name || "Nome file non disponibile" }}
                </a>
              </div>
            </div>
            <div v-else class="text-gray-400 text-sm py-2">
              Nessun file presente
            </div>
          </div>

          <!-- File Upload -->
          <div>
            <h4 class="text-sm font-medium mb-2">Carica nuovi file:</h4>
            <FileUpload
              v-model="filesToUpload"
              mode="basic"
              name="filesToUpload"
              :multiple="true"
              accept="application/pdf,image/*,.doc,.docx"
              :auto="false"
              chooseLabel="Scegli file"
              class="w-full"
              @select="onFileSelect"
              @clear="onFileClear"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Annulla"
          severity="outline"
          @click="editModal = false"
          :disabled="isSaving"
        />
        <Button
          label="Salva"
          severity="info"
          @click="saveChanges"
          :disabled="isSaving"
          :loading="isSaving"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Custom styles can be added here */
</style>
