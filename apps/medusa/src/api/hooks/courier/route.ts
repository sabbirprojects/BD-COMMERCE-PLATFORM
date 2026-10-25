import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POST as handleProviderPost } from "./[provider]/route"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Infer provider from body or header or default to steadfast
  const provider = (req.body as any)?.courier || (req.body as any)?.provider || "steadfast"
  req.params = { ...req.params, provider }
  return handleProviderPost(req, res)
}
