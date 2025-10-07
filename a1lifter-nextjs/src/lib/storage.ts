import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const bucketName = process.env.SUPABASE_ATTEMPT_VIDEO_BUCKET || "attempt-videos"

let serviceClient: SupabaseClient | null = null

function getServiceClient() {
  if (serviceClient) {
    return serviceClient
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase storage service key not configured. Video uploads disabled.")
    return null
  }

  serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })

  return serviceClient
}

interface UploadAttemptVideoOptions {
  attemptId: string
  eventId: string
  userId: string
  fileName: string
  fileBuffer: Buffer
  contentType: string
}

export async function uploadAttemptVideo({
  attemptId,
  eventId,
  userId,
  fileName,
  fileBuffer,
  contentType,
}: UploadAttemptVideoOptions) {
  const client = getServiceClient()
  if (!client) {
    throw new Error("Supabase storage client not configured")
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")
  const objectPath = `${eventId}/${userId}/${attemptId}/${sanitizedFileName}`

  const { error } = await client.storage.from(bucketName).upload(objectPath, fileBuffer, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  })

  if (error) {
    throw error
  }

  const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(objectPath)

  return {
    path: objectPath,
    publicUrl: publicUrlData.publicUrl,
  }
}
