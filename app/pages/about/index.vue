<!--
  @file about/index.vue
  @description Practical about page explaining what military.contractors does and how it works
-->

<script setup lang="ts">
const logger = useLogger("AboutPage");

onMounted(() => {
  logger.info("AboutPage: Mounted");
});

useHead({
  title: "About | military.contractors",
  meta: [
    {
      name: "description",
      content:
        "military.contractors helps veterans find contractor jobs by starting with your MOS or AFSC. See which companies hire your background, filter by clearance and location.",
    },
    {
      name: "keywords",
      content:
        "MOS to civilian jobs, AFSC to contractor jobs, veteran job search, military transition, defense contractor jobs, clearance jobs, security clearance",
    },
    { property: "og:title", content: "About | military.contractors" },
    {
      property: "og:description",
      content:
        "Find contractor jobs matched to your military specialty. Free for veterans.",
    },
    { property: "og:type", content: "website" },
  ],
});
</script>

<template>
  <div class="min-h-full">
    <!-- Content -->
    <div class="container mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="text-muted-foreground mb-8 text-sm">
        <NuxtLink to="/" class="hover:text-primary transition-colors"
          >Home</NuxtLink
        >
        <span class="mx-2">/</span>
        <span class="text-foreground">About</span>
      </nav>

      <!-- Page Title -->
      <header class="mb-10">
        <h1 class="text-foreground mb-3 text-2xl font-bold md:text-3xl">
          About military.contractors
        </h1>
        <p class="text-muted-foreground text-lg">
          A job search tool built around military specialties. Enter your MOS or
          AFSC and see contractor jobs that match your background.
        </p>
      </header>

      <div class="space-y-12 text-sm leading-relaxed">
        <!-- How It Works -->
        <section>
          <h2 class="text-foreground mb-4 text-lg font-bold">How It Works</h2>

          <ol class="text-muted-foreground space-y-4">
            <li>
              <strong class="text-foreground">1. Start with your MOS</strong
              ><br />
              Search by MOS code (25B, 35F, 1B4X1, etc.) or browse by branch.
              Each specialty has its own page with matched jobs and relevant
              companies.
            </li>
            <li>
              <strong class="text-foreground"
                >2. Jobs ranked by match quality</strong
              ><br />
              Jobs are scored based on how well they match your MOS skills,
              clearance requirements, and other factors. Top matches appear
              first.
            </li>
            <li>
              <strong class="text-foreground">3. Filter by what matters</strong
              ><br />
              Filter by clearance level, location, and domain. See which
              companies are actively hiring your specialty.
            </li>
          </ol>
        </section>

        <!-- What We Track -->
        <section>
          <h2 class="text-foreground mb-4 text-lg font-bold">What We Track</h2>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 class="text-foreground mb-2 font-semibold">Job Data</h3>
              <ul class="text-muted-foreground space-y-1">
                <li>Title, company, location</li>
                <li>Clearance requirements</li>
                <li>Location type (CONUS, OCONUS, Remote)</li>
                <li>Salary range (when available)</li>
                <li>MOS match strength</li>
              </ul>
            </div>

            <div>
              <h3 class="text-foreground mb-2 font-semibold">MOS Data</h3>
              <ul class="text-muted-foreground space-y-1">
                <li>4,000+ Army, Navy, Air Force, Marine MOSes</li>
                <li>Skills and certifications mapping</li>
                <li>Related civilian job titles</li>
                <li>Similar MOSes across branches</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Business Model -->
        <section>
          <h2 class="text-foreground mb-4 text-lg font-bold">
            How We Stay Free
          </h2>

          <p class="text-muted-foreground mb-4">
            <strong class="text-foreground">Job seekers never pay.</strong> All
            MOS pages, job listings, filters, and company information are free.
          </p>

          <p class="text-muted-foreground mb-2">Revenue comes from:</p>
          <ul class="text-muted-foreground mb-4 space-y-1">
            <li>
              <strong class="text-foreground">Employers</strong> — Featured job
              listings and targeted placement
            </li>
            <li>
              <strong class="text-foreground">Training providers</strong> —
              Certification program sponsorships
            </li>
          </ul>

          <p class="text-muted-foreground/70 text-xs">
            Sponsored content is always labeled. Job rankings are based on match
            quality, not payment.
          </p>
        </section>

        <!-- Quick Stats -->
        <section>
          <h2 class="text-foreground mb-4 text-lg font-bold">By the Numbers</h2>

          <ul class="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <li>
              <div class="text-foreground font-mono text-xl font-bold">
                4,000+
              </div>
              <div class="text-muted-foreground text-xs">MOSes Tracked</div>
            </li>
            <li>
              <div class="text-foreground font-mono text-xl font-bold">5</div>
              <div class="text-muted-foreground text-xs">Branches</div>
            </li>
            <li>
              <div class="text-foreground font-mono text-xl font-bold">
                100%
              </div>
              <div class="text-muted-foreground text-xs">Free for Vets</div>
            </li>
            <li>
              <div class="text-foreground font-mono text-xl font-bold">$0</div>
              <div class="text-muted-foreground text-xs">No Paywalls</div>
            </li>
          </ul>
        </section>

        <!-- Contact -->
        <section>
          <h2 class="text-foreground mb-4 text-lg font-bold">Contact</h2>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 class="text-foreground mb-1 font-semibold">
                General Inquiries
              </h3>
              <p class="text-muted-foreground mb-2">
                Questions, feedback, or just want to say hey.
              </p>
              <a
                href="mailto:contact@military.contractors"
                class="text-primary font-mono hover:underline"
              >
                contact@military.contractors
              </a>
            </div>

            <div>
              <h3 class="text-foreground mb-1 font-semibold">Employers</h3>
              <p class="text-muted-foreground mb-2">
                Post jobs or discuss sponsored placements.
              </p>
              <a
                href="mailto:advertise@military.contractors"
                class="text-primary font-mono hover:underline"
              >
                advertise@military.contractors
              </a>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button as-child size="lg" class="font-semibold">
            <NuxtLink to="/"> Search MOSes </NuxtLink>
          </Button>
          <Button as-child variant="link" size="lg">
            <NuxtLink to="/companies"> Browse Companies </NuxtLink>
          </Button>
        </section>
      </div>
    </div>
  </div>
</template>
