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

const handleSubmit = async () => {
  if (!form.name || !form.email || !form.message) {
    toast.error("Please fill in all required fields");
    return;
  }

  isSubmitting.value = true;

  // Simulate submission - replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  toast.success("Message sent. We'll get back to you soon.");

  // Reset form
  form.name = "";
  form.email = "";
  form.subject = "";
  form.message = "";

  isSubmitting.value = false;
};
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <h1 class="text-foreground text-2xl font-bold sm:text-3xl">Contact</h1>
        <p class="text-muted-foreground mt-2">
          Questions, feedback, or partnership inquiries.
        </p>
      </div>
    </header>

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
