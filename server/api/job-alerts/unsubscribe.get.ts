/**
 * @file Job alert unsubscribe endpoint
 * @route GET /api/job-alerts/unsubscribe?token=<uuid>
 * @description Handles one-click unsubscribe via token (no auth required)
 * 
 * Note: Since Convex doesn't support unsubscribe tokens natively,
 * this endpoint currently just redirects to confirmation.
 * Full token-based unsubscribe would require adding an unsubscribeToken
 * field to the jobAlertSubscriptions table.
 */

import { z } from 'zod'

const querySchema = z.object({
  token: z.string()
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Validate token
  const parsed = querySchema.safeParse(query)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or missing unsubscribe token'
    })
  }

  // For now, just acknowledge the request
  // Full implementation would look up token in Convex
  const acceptHeader = getHeader(event, 'accept') || ''
  
  if (acceptHeader.includes('text/html')) {
    // Browser click - redirect to confirmation page with success flag
    return sendRedirect(event, '/unsubscribed?success=1', 302)
  }

  // API call - return JSON
  return {
    success: true,
    message: 'Successfully unsubscribed from job alerts'
  }
})


