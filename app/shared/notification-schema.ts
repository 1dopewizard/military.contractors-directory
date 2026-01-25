import { z } from 'zod'

export const notificationSchema = z.object({
  notifications: z.array(
    z.object({
      name: z.string().describe('Name of the person'),
      message: z.string().describe('The notification message'),
      minutesAgo: z.number().describe('How many minutes ago the notification was sent')
    })
  )
})
