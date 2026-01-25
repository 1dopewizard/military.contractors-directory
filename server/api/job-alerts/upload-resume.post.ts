/**
 * @file Resume upload API endpoint
 * @route POST /api/job-alerts/upload-resume
 * @description Upload resume file to local storage
 * @note File storage is handled locally. For production, consider S3/R2/Cloudflare.
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const UPLOAD_DIR = 'uploads/resumes'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded'
    })
  }

  const file = formData.find(f => f.name === 'file')
  const email = formData.find(f => f.name === 'email')?.data.toString()

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file provided'
    })
  }

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  // Validate file type
  const mimeType = file.type || ''
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type. Please upload PDF, DOC, or DOCX.'
    })
  }

  // Validate file size
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File too large. Maximum size is 5MB.'
    })
  }

  try {
    // Create upload directory if it doesn't exist
    const uploadPath = join(process.cwd(), UPLOAD_DIR)
    await mkdir(uploadPath, { recursive: true })

    // Generate unique filename
    const ext = file.filename?.split('.').pop() || 'pdf'
    const filename = `${randomUUID()}.${ext}`
    const filePath = join(uploadPath, filename)

    // Write file to disk
    await writeFile(filePath, file.data)

    // Update job alert subscription with resume path if subscription exists
    const subscription = await db.query.jobAlertSubscription.findFirst({
      where: eq(schema.jobAlertSubscription.email, email),
    })

    if (subscription) {
      await db.update(schema.jobAlertSubscription)
        .set({
          resumeUrl: `/uploads/resumes/${filename}`,
          updatedAt: Date.now(),
        })
        .where(eq(schema.jobAlertSubscription.id, subscription.id))
    }

    return {
      success: true,
      filename,
      path: `/uploads/resumes/${filename}`,
      message: 'Resume uploaded successfully'
    }
  } catch (error) {
    console.error('Resume upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload resume'
    })
  }
})
