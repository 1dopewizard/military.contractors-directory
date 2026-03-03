/**
 * @file Admin delete contractor contact endpoint
 * @route DELETE /api/admin/contractor-contacts/:id
 * @description Delete an HR/contractor contact (admin only) (Drizzle-backed)
 */

import { requireAdmin } from "@/server/utils/better-auth";
import { getDb, schema } from "@/server/utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contact ID is required",
    });
  }

  const db = getDb();

  try {
    await db
      .delete(schema.contractorContact)
      .where(eq(schema.contractorContact.id, id));

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete contractor contact:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete contact",
    });
  }
});
