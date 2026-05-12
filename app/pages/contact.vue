<!--
  @file Contact page
  @route /contact
  @description Contact form and information
-->

<script setup lang="ts">
import { toast } from "vue-sonner";

useHead({
  title: "Contact | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "Get in touch with military.contractors. Questions, feedback, partnership inquiries, or support requests.",
    },
  ],
});

const form = reactive({
  name: "",
  email: "",
  subject: "",
  contractorSlug: "",
  targetField: "",
  evidenceUrl: "",
  message: "",
});

const isSubmitting = ref(false);

const subjectOptions = [
  "General inquiry",
  "Partnership opportunity",
  "Claim a company profile",
  "Report incorrect information",
  "Technical issue",
  "Other",
];

const isProfileWorkflow = computed(
  () =>
    form.subject === "Claim a company profile" ||
    form.subject === "Report incorrect information",
);

const handleSubmit = async () => {
  if (!form.name || !form.email || !form.message) {
    toast.error("Please fill in all required fields");
    return;
  }

  if (isProfileWorkflow.value && !form.contractorSlug) {
    toast.error("Please include the contractor profile slug");
    return;
  }

  isSubmitting.value = true;

  try {
    if (form.subject === "Claim a company profile") {
      await $fetch("/api/profile-claims", {
        method: "POST",
        body: {
          contractorSlug: form.contractorSlug,
          submitterName: form.name,
          companyRole: form.message,
          evidenceUrl: form.evidenceUrl || undefined,
        },
      });
      toast.success("Profile claim submitted for review.");
    } else if (form.subject === "Report incorrect information") {
      await $fetch("/api/profile-corrections", {
        method: "POST",
        body: {
          contractorSlug: form.contractorSlug,
          targetField: form.targetField || "profile",
          explanation: form.message,
          evidenceUrl: form.evidenceUrl || undefined,
        },
      });
      toast.success("Correction request submitted for review.");
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message sent. We'll get back to you soon.");
    }

    form.name = "";
    form.email = "";
    form.subject = "";
    form.contractorSlug = "";
    form.targetField = "";
    form.evidenceUrl = "";
    form.message = "";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Submission failed";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-full">
    <DirectoryPageHeader
      eyebrow="Contact"
      title="Contact"
      description="Questions, feedback, or partnership inquiries."
      max-width="max-w-4xl"
    />

    <!-- Main Content -->
    <main class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-12 md:grid-cols-3">
        <!-- Contact Info -->
        <div class="space-y-6">
          <div>
            <h2 class="text-foreground font-medium">Email</h2>
            <a
              href="mailto:hello@military.contractors"
              class="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              hello@military.contractors
            </a>
          </div>

          <div>
            <h2 class="text-foreground font-medium">Response time</h2>
            <p class="text-muted-foreground text-sm">
              We typically respond within 1-2 business days.
            </p>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="md:col-span-2">
          <form class="space-y-6" @submit.prevent="handleSubmit">
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <Label for="name"
                  >Name <span class="text-destructive">*</span></Label
                >
                <Input
                  id="name"
                  v-model="form.name"
                  type="text"
                  placeholder="Your name"
                  class="mt-2"
                  required
                />
              </div>
              <div>
                <Label for="email"
                  >Email <span class="text-destructive">*</span></Label
                >
                <Input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="you@example.com"
                  class="mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label for="subject">Subject</Label>
              <Select v-model="form.subject">
                <SelectTrigger class="mt-2">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in subjectOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="isProfileWorkflow" class="grid gap-6 sm:grid-cols-2">
              <div>
                <Label for="contractorSlug"
                  >Contractor slug
                  <span class="text-destructive">*</span></Label
                >
                <Input
                  id="contractorSlug"
                  v-model="form.contractorSlug"
                  type="text"
                  placeholder="lockheed-martin"
                  class="mt-2"
                  required
                />
              </div>
              <div>
                <Label for="evidenceUrl">Evidence URL</Label>
                <Input
                  id="evidenceUrl"
                  v-model="form.evidenceUrl"
                  type="url"
                  placeholder="https://..."
                  class="mt-2"
                />
              </div>
            </div>

            <div v-if="form.subject === 'Report incorrect information'">
              <Label for="targetField">Field to correct</Label>
              <Input
                id="targetField"
                v-model="form.targetField"
                type="text"
                placeholder="recipient name, UEI, NAICS, obligations, source link..."
                class="mt-2"
              />
            </div>

            <div>
              <Label for="message"
                >Message <span class="text-destructive">*</span></Label
              >
              <Textarea
                id="message"
                v-model="form.message"
                placeholder="How can we help?"
                class="mt-2 min-h-[150px]"
                required
              />
            </div>

            <Button type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting">Sending...</span>
              <span v-else>Send Message</span>
            </Button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
