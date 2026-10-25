import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createHash, randomUUID } from "crypto"

/**
 * POST /admin/media/upload
 * Media asset upload validation and metadata persistence (AC-5.3).
 * Validates allowed MIME types, size ceiling (5MB), and deduplicates via SHA-256 checksum.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const body = req.body as any

  const {
    filename,
    mime,
    size_bytes,
    data_base64,
    source = "landing_page",
    alt_text_en,
    alt_text_bn,
  } = body

  if (!filename || !mime || !size_bytes) {
    return res.status(400).json({
      error: "Missing required upload parameters: filename, mime, and size_bytes are required.",
    })
  }

  // 1. AC-5.3: Type validation
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
  if (!ALLOWED_MIME_TYPES.includes(mime.toLowerCase())) {
    return res.status(415).json({
      error: `Disallowed media format: "${mime}". Only JPEG, PNG, and WebP images are permitted (AC-5.3).`,
    })
  }

  // Reject executable extensions
  const DISALLOWED_EXTENSIONS = [".exe", ".php", ".js", ".sh", ".py", ".svg", ".html"]
  const hasDangerousExt = DISALLOWED_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
  if (hasDangerousExt) {
    return res.status(415).json({
      error: `File name "${filename}" has a disallowed extension (AC-5.3).`,
    })
  }

  // 2. AC-5.3: 5MB size limit
  const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
  if (size_bytes > MAX_SIZE_BYTES) {
    return res.status(413).json({
      error: `File size exceeds the 5MB ceiling: ${(size_bytes / (1024 * 1024)).toFixed(2)} MB uploaded (max 5 MB allowed) (AC-5.3).`,
    })
  }

  // 3. Compute checksum
  const buffer = data_base64 ? Buffer.from(data_base64, "base64") : Buffer.from(filename)
  const checksum = createHash("sha256").update(buffer).digest("hex")

  // Deduplication check (database.md §3.9.8)
  const existing = await pg.raw(
    `SELECT * FROM media_asset WHERE checksum_sha256 = ? AND size_bytes = ? AND deleted_at IS NULL LIMIT 1`,
    [checksum, size_bytes]
  )
  if (existing.rows && existing.rows.length > 0) {
    return res.json({
      success: true,
      deduplicated: true,
      media_asset: existing.rows[0],
    })
  }

  const mediaId = `media_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const key = `uploads/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`

  await pg.raw(
    `INSERT INTO media_asset (
      id, bucket, key, mime, size_bytes, checksum_sha256,
      alt_text_en, alt_text_bn, source, ref_count, is_orphan,
      created_at, updated_at
    ) VALUES (
      ?, 'default-bucket', ?, ?, ?, ?,
      ?, ?, ?, 1, false,
      now(), now()
    )`,
    [
      mediaId,
      key,
      mime.toLowerCase(),
      size_bytes,
      checksum,
      alt_text_en || null,
      alt_text_bn || null,
      source,
    ]
  )

  const created = await pg.raw(`SELECT * FROM media_asset WHERE id = ?`, [mediaId])

  return res.status(201).json({
    success: true,
    media_asset: created.rows[0],
  })
}
