<!--
  @file AdminHRContacts.vue
  @description Admin dashboard tab for managing HR/employer contacts
-->
<script setup lang="ts">
import { z } from "zod";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";

interface HRContact {
  id: string;
  company_id: string | null;
  company_name: string;
  contact_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  relationship_status: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

const logger = useLogger("AdminHRContacts");

// Data state
const contacts = ref<HRContact[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Dialog state
const isDialogOpen = ref(false);
const editingContact = ref<HRContact | null>(null);
const isSubmitting = ref(false);
const formSubmitted = ref(false);

// Confirm dialog state
const confirmDialog = ref<{
  open: boolean;
  title: string;
  description: string;
  action: () => Promise<void>;
  loading: boolean;
}>({
  open: false,
  title: "",
  description: "",
  action: async () => {},
  loading: false,
});

const openConfirmDialog = (
  title: string,
  description: string,
  action: () => Promise<void>,
) => {
  confirmDialog.value = {
    open: true,
    title,
    description,
    action,
    loading: false,
  };
};

const handleConfirm = async () => {
  confirmDialog.value.loading = true;
  await confirmDialog.value.action();
  confirmDialog.value.loading = false;
  confirmDialog.value.open = false;
};

// Filters
const statusFilter = ref("all");
const searchQuery = ref("");

// Form schema - simple validation, server handles empty string normalization
const contactSchema = toTypedSchema(
  z.object({
    company_name: z.string().min(2, "Company name is required"),
    contact_name: z.string().min(2, "Contact name is required"),
    title: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin_url: z.string(),
    relationship_status: z.string(),
    notes: z.string(),
  }),
);

const form = useForm({
  validationSchema: contactSchema,
  initialValues: {
    company_name: "",
    contact_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    relationship_status: "prospect",
    notes: "",
  },
  validateOnMount: false,
});

const statusOptions = [
  {
    value: "prospect",
    label: "Prospect",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    value: "engaged",
    label: "Engaged",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    value: "active",
    label: "Active",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    value: "inactive",
    label: "Inactive",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
];

const getStatusColor = (status: string) => {
  return (
    statusOptions.find((s) => s.value === status)?.color ||
    "bg-muted text-muted-foreground"
  );
};

// Fetch contacts
const fetchContacts = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ contacts: HRContact[] }>(
      "/api/admin/employer-contacts",
      {
        query: {
          status: statusFilter.value !== "all" ? statusFilter.value : undefined,
          search: searchQuery.value || undefined,
        },
      },
    );
    contacts.value = response.contacts;
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Failed to load contacts";
    logger.error({ error: err }, "Failed to fetch HR contacts");
  } finally {
    isLoading.value = false;
  }
};

// Open dialog for new/edit
const openDialog = (contact?: HRContact) => {
  if (contact) {
    editingContact.value = contact;
    form.setValues({
      company_name: contact.company_name,
      contact_name: contact.contact_name,
      title: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedin_url: contact.linkedin_url || "",
      relationship_status: contact.relationship_status,
      notes: contact.notes || "",
    });
  } else {
    editingContact.value = null;
    form.resetForm();
  }
  formSubmitted.value = false;
  isDialogOpen.value = true;
};

// Submit form
const handleSubmit = async () => {
  formSubmitted.value = true;
  const { valid } = await form.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    const values = form.values;
    const body = {
      company_name: values.company_name,
      contact_name: values.contact_name,
      title: values.title || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      linkedin_url: values.linkedin_url || undefined,
      relationship_status: values.relationship_status,
      notes: values.notes || undefined,
    };

    if (editingContact.value) {
      await $fetch(`/api/admin/employer-contacts/${editingContact.value.id}`, {
        method: "PATCH",
        body,
      });
      toast.success("Contact updated");
    } else {
      await $fetch("/api/admin/employer-contacts", {
        method: "POST",
        body,
      });
      toast.success("Contact created");
    }

    isDialogOpen.value = false;
    await fetchContacts();
  } catch (err: any) {
    toast.error(err.data?.statusMessage || "Failed to save contact");
  } finally {
    isSubmitting.value = false;
  }
};

// Delete contact
const deleteContact = (id: string) => {
  openConfirmDialog(
    "Delete Contact",
    "This will permanently delete this HR contact. This action cannot be undone.",
    async () => {
      try {
        await $fetch(`/api/admin/employer-contacts/${id}`, {
          method: "DELETE",
        });
        toast.success("Contact deleted");
        await fetchContacts();
      } catch (err: any) {
        toast.error(err.data?.statusMessage || "Failed to delete contact");
      }
    },
  );
};

// Log contact (update last_contacted_at)
const logContact = async (contact: HRContact) => {
  try {
    await $fetch(`/api/admin/employer-contacts/${contact.id}`, {
      method: "PATCH",
      body: {
        last_contacted_at: new Date().toISOString(),
        relationship_status:
          contact.relationship_status === "prospect"
            ? "contacted"
            : contact.relationship_status,
      },
    });
    toast.success("Contact logged");
    await fetchContacts();
  } catch (err: any) {
    toast.error("Failed to log contact");
  }
};

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Watch filters
watch([statusFilter, searchQuery], () => {
  fetchContacts();
});

// Init
onMounted(() => {
  fetchContacts();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2
          class="text-foreground text-sm font-semibold tracking-wide uppercase"
        >
          HR Contacts
        </h2>
        <p class="text-muted-foreground text-sm">
          Manage employer relationships for placements
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="fetchContacts">
          <Icon name="mdi:refresh" class="mr-1 h-4 w-4" />
          Refresh
        </Button>
        <Button size="sm" @click="openDialog()">
          <Icon name="mdi:plus" class="mr-1 h-4 w-4" />
          Add Contact
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <div class="min-w-[200px] flex-1">
        <Input
          v-model="searchQuery"
          placeholder="Search by name, company, email..."
          class="h-9"
        />
      </div>
      <Select v-model="statusFilter">
        <SelectTrigger class="h-9 w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner class="text-muted-foreground h-8 w-8" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="border-destructive/30 p-6 text-center">
      <Icon
        name="mdi:alert-circle-outline"
        class="text-destructive mx-auto mb-2 h-8 w-8"
      />
      <p class="text-destructive text-sm">{{ error }}</p>
      <Button variant="ghost" size="sm" class="mt-4" @click="fetchContacts"
        >Try Again</Button
      >
    </Card>

    <!-- Empty -->
    <Empty v-else-if="contacts.length === 0" class="border">
      <EmptyMedia variant="icon">
        <Icon name="mdi:account-tie-outline" class="h-6 w-6" />
      </EmptyMedia>
      <EmptyTitle class="text-base">No contacts found</EmptyTitle>
      <EmptyDescription
        >Add your first HR contact to get started.</EmptyDescription
      >
      <Button size="sm" class="mt-4" @click="openDialog()">
        <Icon name="mdi:plus" class="mr-1.5 h-4 w-4" />
        Add Contact
      </Button>
    </Empty>

    <!-- Contacts List -->
    <div v-else class="divide-border/30 divide-y">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="py-3 first:pt-0"
      >
        <div class="flex items-center gap-4">
          <!-- Contact Info -->
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium">{{
                contact.contact_name
              }}</span>
              <span
                :class="getStatusColor(contact.relationship_status)"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
              >
                {{
                  statusOptions.find(
                    (s) => s.value === contact.relationship_status,
                  )?.label
                }}
              </span>
              <Badge
                v-if="contact.title"
                variant="secondary"
                class="text-[10px]"
              >
                {{ contact.title }}
              </Badge>
            </div>
            <p class="text-muted-foreground text-xs">
              {{ contact.company_name }}
            </p>
            <div
              v-if="contact.email || contact.phone"
              class="mt-1 flex flex-wrap gap-2"
            >
              <span v-if="contact.email" class="text-muted-foreground text-xs">
                {{ contact.email }}
              </span>
              <span v-if="contact.phone" class="text-muted-foreground text-xs">
                {{ contact.phone }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0"
              title="Log contact"
              @click="logContact(contact)"
            >
              <Icon name="mdi:phone-check" class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0"
              title="Edit"
              @click="openDialog(contact)"
            >
              <Icon name="mdi:pencil-outline" class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive h-7 w-7 p-0"
              title="Delete"
              @click="deleteContact(contact.id)"
            >
              <Icon name="mdi:delete-outline" class="h-4 w-4" />
            </Button>
          </div>

          <!-- Date -->
          <span class="text-muted-foreground w-20 shrink-0 text-right text-xs">
            {{ formatDate(contact.last_contacted_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{
            editingContact ? "Edit Contact" : "Add Contact"
          }}</DialogTitle>
          <DialogDescription>
            {{
              editingContact
                ? "Update contact information"
                : "Add a new HR contact for employer outreach"
            }}
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-4 py-2">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label class="text-xs">Company Name *</Label>
              <Input
                :model-value="form.values.company_name"
                @update:model-value="
                  (v) => form.setFieldValue('company_name', String(v))
                "
                placeholder="Lockheed Martin"
              />
              <p
                v-if="formSubmitted && form.errors.value.company_name"
                class="text-destructive text-xs"
              >
                {{ form.errors.value.company_name }}
              </p>
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Contact Name *</Label>
              <Input
                :model-value="form.values.contact_name"
                @update:model-value="
                  (v) => form.setFieldValue('contact_name', String(v))
                "
                placeholder="Jane Smith"
              />
              <p
                v-if="formSubmitted && form.errors.value.contact_name"
                class="text-destructive text-xs"
              >
                {{ form.errors.value.contact_name }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label class="text-xs">Title</Label>
              <Input
                :model-value="form.values.title"
                @update:model-value="
                  (v) => form.setFieldValue('title', String(v))
                "
                placeholder="Talent Acquisition Manager"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Status</Label>
              <Select
                :model-value="form.values.relationship_status"
                @update:model-value="
                  (v) => form.setFieldValue('relationship_status', String(v))
                "
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label class="text-xs">Email</Label>
              <Input
                :model-value="form.values.email"
                @update:model-value="
                  (v) => form.setFieldValue('email', String(v))
                "
                type="email"
                placeholder="jane@company.com"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Phone</Label>
              <Input
                :model-value="form.values.phone"
                @update:model-value="
                  (v) => form.setFieldValue('phone', String(v))
                "
                type="tel"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs">LinkedIn URL</Label>
            <Input
              :model-value="form.values.linkedin_url"
              @update:model-value="
                (v) => form.setFieldValue('linkedin_url', String(v))
              "
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs">Notes</Label>
            <Textarea
              :model-value="form.values.notes"
              @update:model-value="
                (v) => form.setFieldValue('notes', String(v))
              "
              placeholder="Notes about this contact..."
              class="min-h-[80px]"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              class="flex-1"
              @click="isDialogOpen = false"
            >
              Cancel
            </Button>
            <Button type="submit" class="flex-1" :disabled="isSubmitting">
              <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
              {{ editingContact ? "Update" : "Create" }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :loading="confirmDialog.loading"
      variant="destructive"
      confirm-text="Delete"
      @confirm="handleConfirm"
    />
  </div>
</template>
