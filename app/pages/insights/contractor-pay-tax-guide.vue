<!--
  @file insights/contractor-pay-tax-guide.vue
  @route /insights/contractor-pay-tax-guide
  @description Comprehensive 2026 guide to military contractor pay ranges, FEIE tax exclusion,
               combat zone benefits, and total compensation optimization strategies.
-->

<script setup lang="ts">
useHead({
  title: "Military Contractor Pay & Tax Guide 2026 | FEIE $132,900 Exclusion",
  meta: [
    {
      name: "description",
      content:
        "Complete 2026 guide to military contractor pay ($80K-$300K+), Foreign Earned Income Exclusion ($132,900), combat zone tax benefits, and compensation optimization strategies.",
    },
    {
      property: "og:title",
      content:
        "Military Contractor Pay & Tax Guide 2026 | FEIE $132,900 Exclusion",
    },
    {
      property: "og:description",
      content:
        "Complete 2026 guide to military contractor pay ($80K-$300K+), Foreign Earned Income Exclusion ($132,900), combat zone tax benefits, and compensation optimization.",
    },
    { property: "og:type", content: "article" },
  ],
});

useArticleSchema({
  headline: "Military Contractor Pay & Tax Benefits: 2026 Complete Guide",
  description:
    "Complete 2026 guide to military contractor pay ($80K-$300K+), Foreign Earned Income Exclusion ($132,900), combat zone tax benefits, and compensation optimization strategies.",
  datePublished: "2026-03-02",
});

useBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Insights", url: "/insights" },
  {
    name: "Contractor Pay & Tax Guide",
    url: "/insights/contractor-pay-tax-guide",
  },
]);
</script>

<template>
  <div class="min-h-full">
    <!-- Hero -->
    <header class="border-border border-b">
      <div
        class="container mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <Badge variant="secondary" class="mb-4 text-xs">March 2, 2026</Badge>
        <h1
          class="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Military Contractor Pay &amp; Tax Benefits: 2026 Complete Guide
        </h1>
        <p class="text-muted-foreground mt-4 max-w-2xl text-lg">
          Everything you need to know about contractor compensation, the Foreign
          Earned Income Exclusion, combat zone tax benefits, and how to maximize
          your total take-home pay as a defense contractor working overseas.
        </p>
      </div>
    </header>

    <!-- Article -->
    <article>
      <div
        class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div class="max-w-3xl mx-auto">
          <p class="text-muted-foreground leading-relaxed mb-4">
            Military contracting remains one of the fastest paths to six-figure
            income for veterans in 2026. With
            <NuxtLink
              to="/insights/defense-hiring-surge-2026"
              class="text-primary hover:underline"
              >Operation Epic Fury driving the largest hiring surge since
              Iraq</NuxtLink
            >, contractors with the right MOS background, clearances, and
            willingness to deploy are commanding premium rates. But earning
            $150K+ overseas means nothing if you don't understand how to keep
            it. The difference between a well-structured compensation package
            and a poorly negotiated one can be $30,000 or more per year in
            after-tax income.
          </p>
          <p class="text-muted-foreground leading-relaxed mb-4">
            This guide covers real 2026 pay ranges by role, a direct comparison
            to active-duty military compensation, and a deep dive into the tax
            provisions that make overseas contracting uniquely lucrative --
            including the Foreign Earned Income Exclusion, Foreign Housing
            Exclusion, combat zone benefits, and the self-employment tax trap
            that catches thousands of contractors every year.
          </p>

          <!-- Section 1: Contractor Pay Ranges by Role -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Contractor Pay Ranges by Role (2026)
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Contractor pay varies widely based on role category, experience
            level, clearance requirements, and deployment location. The
            following table reflects current 2026 market rates for OCONUS
            positions, primarily in CENTCOM and AFRICOM theaters. These are
            annualized figures for deployed positions and include base salary
            only -- not danger pay, housing allowances, or other supplements
            covered later in this guide.
          </p>

          <div class="overflow-x-auto mb-6">
            <table class="w-full border-border border text-sm">
              <thead>
                <tr class="bg-muted/30">
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Role Category
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Entry
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Mid-Career
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Senior / SOF
                  </th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">Security (PSD)</td>
                  <td class="border-border border-b px-3 py-2">$110,000</td>
                  <td class="border-border border-b px-3 py-2">$150,000</td>
                  <td class="border-border border-b px-3 py-2">$200,000 - $250,000</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">Intelligence Analyst</td>
                  <td class="border-border border-b px-3 py-2">$85,000</td>
                  <td class="border-border border-b px-3 py-2">$115,000</td>
                  <td class="border-border border-b px-3 py-2">$135,000 - $145,000</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">IT / Cybersecurity</td>
                  <td class="border-border border-b px-3 py-2">$90,000</td>
                  <td class="border-border border-b px-3 py-2">$125,000</td>
                  <td class="border-border border-b px-3 py-2">$145,000 - $180,000+</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">Logistics (LOGCAP)</td>
                  <td class="border-border border-b px-3 py-2">$60,000</td>
                  <td class="border-border border-b px-3 py-2">$85,000</td>
                  <td class="border-border border-b px-3 py-2">$100,000 - $120,000</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">Medical (TCCC)</td>
                  <td class="border-border border-b px-3 py-2">$75,000</td>
                  <td class="border-border border-b px-3 py-2">$100,000</td>
                  <td class="border-border border-b px-3 py-2">$120,000 - $130,000</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">SOF Tier 1</td>
                  <td class="border-border border-b px-3 py-2">$150,000</td>
                  <td class="border-border border-b px-3 py-2">$200,000</td>
                  <td class="border-border border-b px-3 py-2">$250,000 - $300,000+</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">Linguist (Arabic/Farsi)</td>
                  <td class="border-border border-b px-3 py-2">$95,000</td>
                  <td class="border-border border-b px-3 py-2">$125,000</td>
                  <td class="border-border border-b px-3 py-2">$140,000 - $150,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-muted-foreground leading-relaxed mb-4">
            SOF Tier 1 operators at the senior level routinely command daily
            rates of $600 or more, translating to annual packages well above
            $250,000. On the other end of the spectrum, LOGCAP logistics
            positions are typically compensated on an hourly basis ranging from
            $17 to $62 per hour depending on the specific role and skill
            requirements. These rates have increased 8-12% since early 2025 as
            the
            <NuxtLink
              to="/insights/defense-hiring-surge-2026"
              class="text-primary hover:underline"
              >demand surge from Iran operations</NuxtLink
            >
            continues to tighten the talent pool. To see which
            <NuxtLink
              to="/insights/mos-demand-middle-east"
              class="text-primary hover:underline"
              >MOS codes command the highest premiums</NuxtLink
            >, check our MOS demand analysis.
          </p>

          <!-- Section 2: Military Pay vs Contractor Pay -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Military Pay vs. Contractor Pay: Side-by-Side
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The single most common question from transitioning service members:
            "How much more will I actually make?" The answer depends on your
            rank, time in service, MOS, and which contractor role you target.
            The table below compares total military compensation (base pay, BAH,
            BAS, tax advantages) against typical contractor pay for equivalent
            roles.
          </p>

          <div class="overflow-x-auto mb-6">
            <table class="w-full border-border border text-sm">
              <thead>
                <tr class="bg-muted/30">
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Profile
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Military Total Comp
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Contractor Pay
                  </th>
                  <th class="border-border border-b px-3 py-2 text-left text-foreground font-semibold">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">E-5, 8 years</td>
                  <td class="border-border border-b px-3 py-2">~$62,000</td>
                  <td class="border-border border-b px-3 py-2">$110,000 - $150,000</td>
                  <td class="border-border border-b px-3 py-2">+77% to +142%</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">E-7, 14 years</td>
                  <td class="border-border border-b px-3 py-2">~$78,000</td>
                  <td class="border-border border-b px-3 py-2">$130,000 - $200,000</td>
                  <td class="border-border border-b px-3 py-2">+67% to +156%</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">O-3, 6 years</td>
                  <td class="border-border border-b px-3 py-2">~$95,000</td>
                  <td class="border-border border-b px-3 py-2">$120,000 - $160,000</td>
                  <td class="border-border border-b px-3 py-2">+26% to +68%</td>
                </tr>
                <tr>
                  <td class="border-border border-b px-3 py-2 text-foreground font-medium">E-7 SOF, 14 years</td>
                  <td class="border-border border-b px-3 py-2">~$82,000</td>
                  <td class="border-border border-b px-3 py-2">$200,000 - $300,000</td>
                  <td class="border-border border-b px-3 py-2">+144% to +266%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-muted-foreground leading-relaxed mb-4">
            These comparisons are striking, but they require important context.
            Military compensation includes benefits that contractors must fund
            themselves or forgo entirely: TRICARE health insurance (worth
            $8,000-$25,000+ for a family plan), TSP matching, pension accrual
            toward a 20-year retirement, VA benefits eligibility, and GI Bill
            transfer. Contractors typically receive none of these. When you
            factor in the cost of private health insurance ($6,000-$18,000
            annually), retirement contributions, and the loss of VA benefit
            accrual, the real gap narrows -- though it remains significant,
            especially for SOF-qualified personnel. The E-7 SOF comparison is
            particularly telling: the military pays special operations personnel
            roughly the same as conventional forces, while the private sector
            values that skillset at 3-4x the rate.
          </p>

          <!-- Section 3: Foreign Earned Income Exclusion -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Foreign Earned Income Exclusion (FEIE)
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The Foreign Earned Income Exclusion is the single most valuable tax
            provision for overseas defense contractors. For tax year 2026, the
            FEIE allows qualifying U.S. citizens and residents working abroad to
            exclude the first <strong class="text-foreground">$132,900</strong>
            of foreign earned income from federal income tax. This is not a
            deduction -- it is a full exclusion. That income is simply not
            taxed.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Qualifying for the FEIE
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            There are two ways to qualify, and most contractors use the first:
          </p>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">Physical Presence Test:</strong>
              You must be physically present in a foreign country for at least
              330 full days during any 12-month period. This is the standard
              test for deployed contractors. A "full day" means midnight to
              midnight -- travel days where you are in transit between the U.S.
              and a foreign country do not count. You have 35 days of margin,
              which covers most standard R&amp;R schedules.
            </li>
            <li>
              <strong class="text-foreground">Bona Fide Residence Test:</strong>
              You must be a bona fide resident of a foreign country for an
              uninterrupted period that includes an entire tax year. This test
              is more subjective and typically applies to contractors living
              permanently overseas with local housing, bank accounts, and social
              ties. Most deployed contractors on rotational schedules use the
              Physical Presence Test instead.
            </li>
          </ul>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Combat zone contractors working in designated areas qualify under
            the Physical Presence Test. The IRS has consistently ruled that
            presence in a combat zone constitutes presence in a foreign country,
            even on U.S. military installations.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            FEIE Calculation Example
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Here is what the FEIE means in practice for a contractor earning
            $150,000 overseas:
          </p>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">Gross earned income:</strong>
              $150,000
            </li>
            <li>
              <strong class="text-foreground">FEIE exclusion:</strong>
              -$132,900
            </li>
            <li>
              <strong class="text-foreground">Taxable income:</strong> $17,100
            </li>
            <li>
              <strong class="text-foreground">Approximate federal tax:</strong>
              ~$1,900
            </li>
            <li>
              <strong class="text-foreground">Effective tax rate:</strong> ~1.3%
            </li>
          </ul>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Without the FEIE, this same contractor would owe approximately
            $25,000 in federal income tax -- an effective rate of about 16.7%.
            The FEIE saves roughly <strong class="text-foreground">$23,100</strong>
            in this scenario. For contractors earning exactly at the exclusion
            threshold or below, the federal income tax liability can be reduced
            to zero. This is why deployed contractors who carefully track their
            days overseas can achieve take-home pay that far exceeds what
            equivalent stateside positions offer.
          </p>

          <!-- Section 4: Foreign Housing Exclusion -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Foreign Housing Exclusion
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The Foreign Housing Exclusion (FHE) is an additional tax benefit
            that stacks on top of the FEIE. For 2026, the base housing amount
            is approximately <strong class="text-foreground">$20,800</strong>
            (16% of the FEIE limit), meaning qualified housing expenses above
            this base amount can be excluded from income up to a maximum that
            varies by location. In high-cost areas like Qatar, UAE, or Bahrain,
            the IRS sets higher limits that can result in an additional
            exclusion of $15,000-$35,000 beyond the FEIE.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            W-2 vs. 1099 Treatment
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            How the housing exclusion works depends on your employment
            classification:
          </p>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">W-2 employees</strong> claim the
              Foreign Housing Exclusion, which reduces taxable wages. Your
              employer-provided housing is excluded from income to the extent
              it exceeds the base amount.
            </li>
            <li>
              <strong class="text-foreground">1099 contractors</strong> claim
              the Foreign Housing Deduction instead, which functions as an
              above-the-line deduction on Schedule C. The math is similar, but
              the deduction is limited to your net self-employment income.
            </li>
          </ul>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            What Qualifies as Housing Expenses
          </h3>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">Covered:</strong> Rent, utilities
              (excluding telephone), real and personal property insurance,
              occupancy taxes, nonrefundable deposits, rental of furniture, and
              residential parking.
            </li>
            <li>
              <strong class="text-foreground">Not covered:</strong> Mortgage
              payments, domestic labor (maids, gardeners), purchased furniture,
              pay TV subscriptions, home improvements, or costs that are
              "lavish or extravagant."
            </li>
          </ul>

          <!-- Section 5: Combat Zone Tax Benefits -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Combat Zone Tax Benefits
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The Iran theater of operations has been designated a combat zone
            for 2026, extending tax benefits that previously applied in Iraq,
            Afghanistan, and Syria. These provisions affect both active-duty
            military and civilian contractors, though the mechanics differ
            significantly.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Active-Duty Military
          </h3>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">Enlisted members:</strong> All
              military pay received while serving in the combat zone is
              completely exempt from federal income tax. This includes base pay,
              reenlistment bonuses, and special pays. There is no cap for
              enlisted personnel.
            </li>
            <li>
              <strong class="text-foreground">Officers:</strong> The exclusion
              is capped at the highest enlisted pay rate plus any hostile
              fire/imminent danger pay. For 2026, this cap is approximately
              $10,500 per month.
            </li>
          </ul>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Civilian Contractors
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Civilian contractors in combat zones do not receive the same blanket
            tax exemption as military personnel. Instead, contractors rely on
            the FEIE provisions described above. However, combat zone
            designation does provide meaningful ancillary benefits:
          </p>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">Filing extension:</strong>
              Contractors in a combat zone receive an automatic 180-day
              extension for filing tax returns and paying taxes, starting from
              the last day of combat zone service. This can effectively give
              you until late 2027 to file your 2026 return if you are deployed
              through the end of the year.
            </li>
            <li>
              <strong class="text-foreground">FEIE qualification:</strong>
              Physical presence in a designated combat zone counts toward the
              330-day Physical Presence Test, and the IRS is generally more
              lenient about documentation requirements for contractors in
              hazardous areas.
            </li>
            <li>
              <strong class="text-foreground">Forgiveness of deadlines:</strong>
              Various IRS deadlines for actions like IRA contributions,
              estimated tax payments, and filing claims for refund are
              suspended during combat zone service.
            </li>
          </ul>

          <!-- Section 6: The Self-Employment Tax Trap -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            The Self-Employment Tax Trap
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            This is where many contractors get blindsided. If you work as a
            1099 independent contractor -- which is common in the defense
            contracting world, especially for smaller PMCs and subcontractors
            -- you are subject to self-employment (SE) tax of
            <strong class="text-foreground">15.3%</strong>. This breaks down
            to 12.4% for Social Security (on income up to $168,600 in 2026)
            and 2.9% for Medicare (no cap). The critical detail:
            <strong class="text-foreground"
              >the FEIE does NOT reduce your self-employment tax
              liability</strong
            >.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            The Math That Hurts
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Consider a 1099 contractor earning $150,000 overseas:
          </p>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">FEIE saves:</strong> ~$23,100 in
              federal income tax (as calculated above)
            </li>
            <li>
              <strong class="text-foreground">SE tax owed:</strong> ~$21,200
              (15.3% on 92.35% of $150,000)
            </li>
            <li>
              <strong class="text-foreground">Net tax liability:</strong>
              ~$23,100 ($1,900 income tax + $21,200 SE tax)
            </li>
            <li>
              <strong class="text-foreground">Effective rate:</strong> ~15.4%
              -- nearly as high as if you had no FEIE at all
            </li>
          </ul>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The FEIE eliminates your income tax, but the self-employment tax
            eats most of those savings. This is the single largest tax mistake
            1099 contractors make overseas: assuming the FEIE means they owe
            nothing. It does not.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Mitigation Strategies
          </h3>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground">S-Corp election:</strong> By
              electing S-Corporation status, you can pay yourself a
              "reasonable salary" (subject to SE tax) and take the remainder as
              distributions (not subject to SE tax). On $150,000 income, a
              $70,000 salary and $80,000 distribution could reduce SE tax from
              ~$21,200 to ~$10,700 -- a savings of roughly $10,500. Consult a
              tax professional, as the IRS scrutinizes "reasonable salary"
              determinations.
            </li>
            <li>
              <strong class="text-foreground">Negotiate W-2 status:</strong>
              As a W-2 employee, your employer pays half of FICA (7.65%), and
              you pay the other half. Your total Social Security and Medicare
              cost drops from 15.3% to 7.65%, and your employer's portion is
              not your problem. This alone can save $10,000+ annually.
            </li>
            <li>
              <strong class="text-foreground">Maximize deductions:</strong>
              Legitimate business expenses reduce your Schedule C net income,
              which in turn reduces your SE tax base. Equipment, professional
              development, travel, communications, and professional insurance
              premiums all count.
            </li>
          </ul>

          <!-- Section 7: Danger Pay & Hardship Differentials -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Danger Pay &amp; Hardship Differentials
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Unlike the government pay scale, contractor danger pay and hardship
            supplements are not standardized. Each company sets its own rates,
            and these are frequently negotiable -- especially in the current
            market where
            <NuxtLink
              to="/insights/contractors-hiring-now"
              class="text-primary hover:underline"
              >contractors are competing aggressively for qualified
              personnel</NuxtLink
            >. Here is what to expect:
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Common Supplements
          </h3>
          <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
            <li>
              <strong class="text-foreground"
                >Hostile fire / imminent danger supplement:</strong
              >
              $225 to $450 per month, depending on the threat level at your
              specific location. Some companies pay a flat daily rate instead.
            </li>
            <li>
              <strong class="text-foreground">Post differential:</strong> 5% to
              35% of base salary, reflecting the difficulty of living and
              working conditions at your assigned location. Locations like Iraq,
              Syria, and parts of Iran command the highest differentials.
            </li>
            <li>
              <strong class="text-foreground">R&amp;R (rest and recuperation):</strong>
              Typically 4 weeks of paid leave per 6-month deployment rotation.
              Some companies offer 2 weeks per quarter. R&amp;R flights home are
              usually company-paid, though not always to your preferred
              destination.
            </li>
          </ul>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            Defense Base Act Insurance
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The Defense Base Act (DBA) requires that all contractors working
            outside the U.S. on government contracts be covered by workers'
            compensation insurance. This is not optional -- your employer must
            provide DBA coverage. It covers injury, disability, and death
            arising from employment on a U.S. military base or under a U.S.
            government contract overseas. If your employer is not providing DBA
            insurance, that is a serious red flag. DBA premiums are paid by the
            employer and should never be deducted from your compensation.
          </p>

          <!-- Section 8: Maximizing Your Total Compensation -->
          <h2 class="text-foreground text-2xl font-bold mt-12 mb-4">
            Maximizing Your Total Compensation
          </h2>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Understanding the pay and tax landscape is only half the equation.
            The following strategies can add $20,000-$50,000 to your effective
            annual compensation, depending on your situation.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            1. Negotiate W-2 Over 1099
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            As covered in the SE tax section, W-2 status saves you roughly
            7.65% in payroll taxes compared to 1099. On a $150,000 salary,
            that is $11,475 in your pocket instead of the IRS's. Many
            companies will offer either arrangement -- always push for W-2
            unless you have a specific tax strategy (such as an established
            S-Corp) that makes 1099 advantageous.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            2. Stack the FEIE and Housing Exclusion
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Combining the $132,900 FEIE with the Foreign Housing Exclusion can
            push your total exclusion above $150,000 in high-cost locations.
            Ensure your contract is structured so that housing expenses are
            documented separately from base compensation. This requires
            coordination with your employer and a tax preparer who specializes
            in expat returns (Form 2555).
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            3. Plan Deployments Around the 330-Day Test
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            The Physical Presence Test uses any rolling 12-month period, not
            the calendar year. If you deploy in March, your 12-month window
            runs March to March. Plan your R&amp;R and home visits carefully --
            you only have 35 days of leeway. Missing the 330-day threshold by
            even one day disqualifies the entire exclusion for that period.
            Track your days meticulously. Use a spreadsheet or one of the FEIE
            tracking apps designed for expats.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            4. Time Contract Renewals Strategically
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            When switching between contracts or companies, avoid returning to
            the U.S. for extended periods between assignments. A gap of even
            two weeks stateside can jeopardize your 330-day count if you have
            already used your margin. If possible, negotiate start dates for
            new contracts that overlap with your departure from the current
            one, or spend transition time in a third country.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            5. Solo 401(k) for 1099 Contractors
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            If you are 1099 and cannot switch to W-2, open a Solo 401(k). You
            can contribute up to $23,500 as an employee deferral (2026 limit)
            plus up to 25% of net self-employment income as employer
            contributions, for a combined maximum of $70,000. These
            contributions reduce your taxable income and, in the case of
            employer contributions, also reduce your SE tax base. The Solo
            401(k) is the single best retirement vehicle available to 1099
            contractors.
          </p>

          <h3 class="text-foreground text-xl font-semibold mt-8 mb-3">
            6. State Tax Implications
          </h3>
          <p class="text-muted-foreground leading-relaxed mb-4">
            Your state of legal residency matters. States like Texas, Florida,
            Nevada, Wyoming, Washington, and South Dakota have no state income
            tax. If you are deploying overseas for an extended period,
            establishing residency in a no-income-tax state before departure
            can save 5-13% in state taxes. Some states (Virginia, California,
            New York) are notoriously aggressive about claiming residents who
            work abroad still owe state tax. If you currently reside in a
            high-tax state, consult with a tax professional about establishing
            domicile in a tax-free state before your deployment. This requires
            genuine relocation -- not just a P.O. box.
          </p>

          <!-- Section 9: CTA -->
          <div class="border-border border-t mt-16 pt-12">
            <div class="text-center">
              <h2 class="text-foreground text-2xl font-bold">
                Know what you're worth. Get placed at the right rate.
              </h2>
              <p class="text-muted-foreground mt-2 max-w-xl mx-auto">
                Whether you are negotiating your first contract or leveraging a
                decade of deployments, the right placement means the right
                compensation. Connect with defense contractors actively hiring
                your specialty at competitive rates.
              </p>
              <div class="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <Button as-child>
                  <NuxtLink to="/for-companies">For Companies</NuxtLink>
                </Button>
                <Button variant="outline" as-child>
                  <NuxtLink to="/insights/contractors-hiring-now"
                    >See Who's Hiring Now</NuxtLink
                  >
                </Button>
              </div>
            </div>
          </div>

          <!-- Related Articles -->
          <div class="mt-12">
            <h3 class="text-foreground text-xl font-semibold mb-4">
              Related Insights
            </h3>
            <ul class="text-muted-foreground space-y-2 mb-6 ml-6 list-disc">
              <li>
                <NuxtLink
                  to="/insights/defense-hiring-surge-2026"
                  class="text-primary hover:underline"
                  >Defense Contractor Hiring Surge: What the Iran Conflict
                  Means for Veterans</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/insights/contractors-hiring-now"
                  class="text-primary hover:underline"
                  >Which Defense Contractors Are Hiring Now (March
                  2026)</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/insights/mos-demand-middle-east"
                  class="text-primary hover:underline"
                  >MOS Codes Most in Demand for Middle East Operations
                  (2026)</NuxtLink
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>
