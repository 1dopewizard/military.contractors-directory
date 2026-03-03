/**
 * @file Admin update contractor contact endpoint
 * @route PATCH /api/admin/contractor-contacts/:id
 * @description Update an HR/contractor contact (admin or recruiter) (Drizzle-backed)
 */

import { z } from "zod";
import { requireAdminOrRecruiter } from "@/server/utils/better-auth";
import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contact ID is required",
    });
  }

  const body = await readBody(event);

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: parsed.error.flatten(),
    });
  }

  const db = getDb();

  try {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.isPrimary !== undefined)
      updateData.isPrimary = parsed.data.isPrimary;

    await db
      .update(schema.contractorContact)
      .set(updateData)
      .where(eq(schema.contractorContact.id, id));

    // Fetch updated contact with contractor info
    const [result] = await db
      .select({
        contact: schema.contractorContact,
        contractor: schema.contractor,
      })
      .from(schema.contractorContact)
      .leftJoin(
        schema.contractor,
        eq(schema.contractor.id, schema.contractorContact.contractorId),
      )
      .where(eq(schema.contractorContact.id, id))
      .limit(1);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: "Contact not found",
      });
    }

    const { contact, contractor } = result;

    return {
      success: true,
      contact: {
        id: contact.id,
        contractor_id: contact.contractorId,
        contractor_name: contractor?.name ?? null,
        name: contact.name,
        email: contact.email,
        title: contact.title,
        phone: contact.phone,
        is_primary: contact.isPrimary,
        created_at: contact.createdAt?.toISOString() ?? null,
        updated_at: contact.updatedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to update contractor contact:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update contact",
    });
  }
});
