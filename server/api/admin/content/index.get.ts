/**
 * @file List pending content
 * @route GET /api/admin/content
 * @description Returns all pending sponsored content for admin review
 */

import { getDb, schema } from "@/server/utils/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/server/utils/better-auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = getDb();

  const content = await db
    .select({
      id: schema.sponsoredContent.id,
      type: schema.sponsoredContent.type,
      status: schema.sponsoredContent.status,
      title: schema.sponsoredContent.title,
      content: schema.sponsoredContent.content,
      createdAt: schema.sponsoredContent.createdAt,
      claimedProfileId: schema.sponsoredContent.claimedProfileId,
      contractorName: schema.contractor.name,
      contractorSlug: schema.contractor.slug,
    })
    .from(schema.sponsoredContent)
    .innerJoin(
      schema.claimedProfile,
      eq(schema.sponsoredContent.claimedProfileId, schema.claimedProfile.id),
    )
    .innerJoin(
      schema.contractor,
      eq(schema.claimedProfile.contractorId, schema.contractor.id),
    )
    .where(eq(schema.sponsoredContent.status, "pending_review"))
    .orderBy(desc(schema.sponsoredContent.createdAt));

  return content.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    content: item.content,
    createdAt: item.createdAt?.toISOString(),
    contractor: {
      name: item.contractorName,
      slug: item.contractorSlug,
    },
  }));
});
