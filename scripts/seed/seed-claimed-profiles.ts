#!/usr/bin/env npx tsx
/**
 * @file Seed claimed profiles with demo sponsored content
 * @description Creates demo claimed profiles for Lockheed Martin, CACI, and Booz Allen Hamilton
 * @usage pnpm tsx scripts/seed/seed-claimed-profiles.ts
 */

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import { resolve } from 'path'
import * as schema from '../../server/database/schema'

const dbPath = resolve(process.cwd(), 'server/database/app.db')
const client = createClient({ url: `file:${dbPath}` })

const db = drizzle(client, { schema })

// Demo data
const claimedProfilesData = [
  {
    contractorSlug: 'lockheed-martin',
    tier: 'premium' as const,
    benefits: [
      {
        icon: 'mdi:cash-multiple',
        title: 'Competitive Compensation',
        description: 'Industry-leading salaries, bonuses, and comprehensive benefits package including 401(k) match.',
      },
      {
        icon: 'mdi:school-outline',
        title: 'Career Development',
        description: 'Extensive training programs, tuition reimbursement, and clear paths for advancement.',
      },
      {
        icon: 'mdi:rocket-launch-outline',
        title: 'Cutting-Edge Projects',
        description: 'Work on the most advanced aerospace and defense technologies shaping the future.',
      },
    ],
    programs: [
      {
        name: 'F-35 Lightning II',
        category: 'Combat Aircraft',
        description: 'The world\'s most advanced multi-role stealth fighter.',
      },
      {
        name: 'F-22 Raptor',
        category: 'Combat Aircraft',
        description: 'Fifth-generation air superiority fighter.',
      },
      {
        name: 'Space Launch System',
        category: 'Space Systems',
        description: 'NASA\'s deep space exploration rocket.',
      },
    ],
    spotlight: {
      title: 'Engineering the Future of Defense',
      content: 'At Lockheed Martin, we\'re not just building products - we\'re shaping the future of global security. Join a team of 116,000 innovators solving the world\'s most complex challenges.',
      ctaText: 'Explore Careers',
      ctaUrl: 'https://www.lockheedmartinjobs.com/',
    },
    testimonials: [
      {
        quote: 'Working on the F-35 program has been the highlight of my career. The technology we\'re developing is truly groundbreaking.',
        employeeName: 'Sarah Chen',
        employeeTitle: 'Senior Systems Engineer',
      },
      {
        quote: 'The mentorship and growth opportunities here are unmatched. I\'ve advanced from intern to program manager in 8 years.',
        employeeName: 'Marcus Johnson',
        employeeTitle: 'Program Manager',
      },
    ],
  },
  {
    contractorSlug: 'caci-international',
    tier: 'claimed' as const,
    benefits: [
      {
        icon: 'mdi:account-group-outline',
        title: 'Employee-Owned Culture',
        description: 'Every employee has a stake in our success through our Employee Stock Ownership Plan.',
      },
      {
        icon: 'mdi:shield-check-outline',
        title: 'Mission Focus',
        description: 'Make a real difference supporting national security and intelligence missions.',
      },
      {
        icon: 'mdi:home-outline',
        title: 'Flexible Work',
        description: 'Remote and hybrid options available for many positions across the country.',
      },
    ],
    programs: [
      {
        name: 'Enterprise IT Solutions',
        category: 'IT Services',
        description: 'Modernizing federal IT infrastructure and cybersecurity.',
      },
      {
        name: 'Intelligence Services',
        category: 'Intelligence',
        description: 'Supporting the intelligence community with advanced analytics.',
      },
    ],
    spotlight: null,
    testimonials: [],
  },
  {
    contractorSlug: 'booz-allen-hamilton',
    tier: 'premium' as const,
    benefits: [
      {
        icon: 'mdi:lightbulb-outline',
        title: 'Innovation Culture',
        description: 'Dedicated labs and innovation centers fostering creative problem-solving.',
      },
      {
        icon: 'mdi:chart-line',
        title: 'Consulting Excellence',
        description: 'Learn from industry leaders and work with Fortune 500 clients and government agencies.',
      },
      {
        icon: 'mdi:heart-outline',
        title: 'Wellness First',
        description: 'Comprehensive mental health support, fitness programs, and work-life balance initiatives.',
      },
    ],
    programs: [
      {
        name: 'AI/ML Solutions',
        category: 'Artificial Intelligence',
        description: 'Developing next-generation AI capabilities for defense and commercial clients.',
      },
      {
        name: 'Cyber Operations',
        category: 'Cybersecurity',
        description: 'Protecting critical infrastructure from evolving threats.',
      },
      {
        name: 'Digital Transformation',
        category: 'Consulting',
        description: 'Helping organizations modernize operations and embrace technology.',
      },
      {
        name: 'Cloud Engineering',
        category: 'Cloud',
        description: 'Building secure, scalable cloud solutions for government agencies.',
      },
    ],
    spotlight: {
      title: 'Where Consulting Meets Technology',
      content: 'Booz Allen Hamilton combines consulting expertise with technical innovation to solve complex problems. Join 32,000+ professionals making an impact.',
      ctaText: 'Join Our Team',
      ctaUrl: 'https://www.boozallen.com/careers.html',
    },
    testimonials: [
      {
        quote: 'The variety of projects and clients keeps every day interesting. I\'ve grown more here in 3 years than anywhere else.',
        employeeName: 'David Park',
        employeeTitle: 'Principal Data Scientist',
      },
    ],
  },
]

async function seed() {
  console.log('Seeding claimed profiles with demo data...\n')

  // First, create a demo admin user if not exists
  let demoUserId = 'demo-admin-user'
  const [existingUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, demoUserId))
    .limit(1)

  if (!existingUser) {
    await db.insert(schema.user).values({
      id: demoUserId,
      name: 'Demo Admin',
      email: 'demo@military.contractors',
      emailVerified: true,
      isAdmin: true,
    })
    console.log('Created demo admin user')
  }

  for (const data of claimedProfilesData) {
    // Find contractor
    const [contractor] = await db
      .select()
      .from(schema.contractor)
      .where(eq(schema.contractor.slug, data.contractorSlug))
      .limit(1)

    if (!contractor) {
      console.log(`Contractor ${data.contractorSlug} not found, skipping...`)
      continue
    }

    // Check if already claimed
    const [existingClaim] = await db
      .select()
      .from(schema.claimedProfile)
      .where(eq(schema.claimedProfile.contractorId, contractor.id))
      .limit(1)

    let claimedProfileId: string

    if (existingClaim) {
      claimedProfileId = existingClaim.id
      console.log(`${contractor.name}: Already claimed, updating...`)
      
      // Update tier
      await db
        .update(schema.claimedProfile)
        .set({ 
          tier: data.tier, 
          status: 'active',
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.claimedProfile.id, claimedProfileId))
    } else {
      // Create claimed profile
      const [newClaim] = await db
        .insert(schema.claimedProfile)
        .values({
          contractorId: contractor.id,
          userId: demoUserId,
          tier: data.tier,
          status: 'active',
          verifiedAt: new Date(),
          verificationMethod: 'manual',
        })
        .returning()

      claimedProfileId = newClaim.id
      console.log(`${contractor.name}: Created claimed profile (${data.tier} tier)`)
    }

    // Clear existing benefits and add new ones
    await db
      .delete(schema.employerBenefit)
      .where(eq(schema.employerBenefit.claimedProfileId, claimedProfileId))

    for (let i = 0; i < data.benefits.length; i++) {
      await db.insert(schema.employerBenefit).values({
        claimedProfileId,
        icon: data.benefits[i].icon,
        title: data.benefits[i].title,
        description: data.benefits[i].description,
        sortOrder: i,
      })
    }
    console.log(`  - Added ${data.benefits.length} benefits`)

    // Clear existing programs and add new ones
    await db
      .delete(schema.employerProgram)
      .where(eq(schema.employerProgram.claimedProfileId, claimedProfileId))

    for (let i = 0; i < data.programs.length; i++) {
      await db.insert(schema.employerProgram).values({
        claimedProfileId,
        name: data.programs[i].name,
        category: data.programs[i].category,
        description: data.programs[i].description,
        sortOrder: i,
      })
    }
    console.log(`  - Added ${data.programs.length} programs`)

    // Add spotlight if premium and has data
    if (data.spotlight && (data.tier === 'premium' || data.tier === 'enterprise')) {
      await db
        .delete(schema.sponsoredContent)
        .where(eq(schema.sponsoredContent.claimedProfileId, claimedProfileId))

      await db.insert(schema.sponsoredContent).values({
        claimedProfileId,
        type: 'spotlight',
        status: 'approved',
        title: data.spotlight.title,
        content: data.spotlight.content,
        ctaText: data.spotlight.ctaText,
        ctaUrl: data.spotlight.ctaUrl,
        reviewedBy: demoUserId,
        reviewedAt: new Date(),
      })
      console.log(`  - Added spotlight content`)
    }

    // Add testimonials if premium
    if (data.testimonials.length > 0 && (data.tier === 'premium' || data.tier === 'enterprise')) {
      await db
        .delete(schema.employerTestimonial)
        .where(eq(schema.employerTestimonial.claimedProfileId, claimedProfileId))

      for (const testimonial of data.testimonials) {
        await db.insert(schema.employerTestimonial).values({
          claimedProfileId,
          quote: testimonial.quote,
          employeeName: testimonial.employeeName,
          employeeTitle: testimonial.employeeTitle,
          status: 'approved',
        })
      }
      console.log(`  - Added ${data.testimonials.length} testimonials`)
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
