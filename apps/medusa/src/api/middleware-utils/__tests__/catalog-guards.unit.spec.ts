import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  validateMediaUploads,
  validateProductOptionsCap,
  validateProductPublish,
  validateVariantSkuUniqueness,
} from "../catalog-guards"

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
  }
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (data: any) => {
    res.body = data
    return res
  }
  return res
}

describe("Catalog Guards (Prompt 03)", () => {
  describe("validateProductOptionsCap (CHK-CAT-02)", () => {
    it("allows products with 1, 2, or 3 option types", async () => {
      const req: any = {
        params: {},
        body: {
          title: "Panjabi",
          options: [{ title: "Size" }, { title: "Color" }, { title: "Fabric" }],
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateProductOptionsCap(req, res, next)
      expect(nextCalled).toBe(true)
      expect(res.statusCode).toBe(200)
    })

    it("rejects products with 4 or more option types with HTTP 400", async () => {
      const req: any = {
        params: {},
        body: {
          title: "Invalid Product",
          options: [
            { title: "Size" },
            { title: "Color" },
            { title: "Material" },
            { title: "Fit" },
          ],
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateProductOptionsCap(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe("Maximum 3 option types allowed per product.")
    })

    it("rejects adding a 4th option to an existing product with 3 options", async () => {
      const req: any = {
        url: "/admin/products/prod_123/options",
        params: { id: "prod_123" },
        body: { title: "Fit" },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "prod_123",
                      options: [{ id: "opt_1" }, { id: "opt_2" }, { id: "opt_3" }],
                    },
                  ],
                }),
              }
            }
            return null
          },
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateProductOptionsCap(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe("Maximum 3 option types allowed per product.")
    })
  })

  describe("validateVariantSkuUniqueness (AC-3.2)", () => {
    it("rejects duplicate SKUs within product creation payload", async () => {
      const req: any = {
        params: {},
        body: {
          title: "Test Product",
          variants: [
            { title: "V1", sku: "SKU-DUP-1" },
            { title: "V2", sku: "SKU-DUP-1" },
          ],
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateVariantSkuUniqueness(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe("Two variants cannot share the same SKU within a product.")
    })

    it("allows distinct SKUs within product creation payload", async () => {
      const req: any = {
        params: {},
        body: {
          title: "Test Product",
          variants: [
            { title: "V1", sku: "SKU-UNIQ-1" },
            { title: "V2", sku: "SKU-UNIQ-2" },
          ],
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateVariantSkuUniqueness(req, res, next)
      expect(nextCalled).toBe(true)
      expect(res.statusCode).toBe(200)
    })
  })

  describe("validateMediaUploads (CHK-CAT-05)", () => {
    it("allows valid JPEG, PNG, WebP images under 5MB", async () => {
      const req: any = {
        files: [
          {
            originalname: "product.jpg",
            mimetype: "image/jpeg",
            size: 2 * 1024 * 1024, // 2MB
          },
          {
            originalname: "detail.webp",
            mimetype: "image/webp",
            size: 1 * 1024 * 1024, // 1MB
          },
        ],
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateMediaUploads(req, res, next)
      expect(nextCalled).toBe(true)
      expect(res.statusCode).toBe(200)
    })

    it("rejects files exceeding 5MB limit", async () => {
      const req: any = {
        files: [
          {
            originalname: "heavy-image.png",
            mimetype: "image/png",
            size: 6 * 1024 * 1024, // 6MB > 5MB
          },
        ],
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateMediaUploads(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toContain("File size exceeds 5MB limit")
    })

    it("rejects disallowed MIME types and SVG files", async () => {
      const req: any = {
        files: [
          {
            originalname: "vector.svg",
            mimetype: "image/svg+xml",
            size: 100 * 1024,
          },
        ],
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateMediaUploads(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toContain("Only JPG, PNG, and WebP images are permitted.")
    })

    it("rejects dangerous executable files (.exe, .php, etc.)", async () => {
      const req: any = {
        files: [
          {
            originalname: "malicious.exe",
            mimetype: "application/x-msdownload",
            size: 50 * 1024,
          },
        ],
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateMediaUploads(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toContain("Only JPG, PNG, and WebP images are permitted.")
    })
  })

  describe("validateProductPublish (AC-10.2)", () => {
    it("rejects publishing if English title is missing or empty", async () => {
      const req: any = {
        params: {},
        body: {
          title: "   ",
          status: "published",
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateProductPublish(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe("Product title is required to publish a product.")
    })

    it("rejects publishing if translation review is in 'failed' status", async () => {
      const req: any = {
        params: { id: "prod_123" },
        body: {
          title: "Men's Cotton Panjabi",
          status: "published",
        },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "trrev_123",
                      translation_status: "failed",
                    },
                  ],
                }),
              }
            }
            return null
          },
        },
      }
      const res = createMockRes()
      let nextCalled = false
      const next = () => {
        nextCalled = true
      }

      await validateProductPublish(req, res, next)
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe("Cannot publish product with failed translations.")
    })
  })
})
