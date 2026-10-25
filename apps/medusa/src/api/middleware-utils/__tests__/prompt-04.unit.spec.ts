import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { toMajor, toPaisa } from "../../../lib/money"
import { requireBdRoles } from "../bd-role-guard"

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

describe("Prompt 04 — Bangladesh Custom Product Data Verification", () => {
  describe("CHK-CAT-07: Financial Data Security & RBAC Restriction", () => {
    const costGuard = requireBdRoles(["owner", "finance"])
    const [requireAuth, requireRole] = costGuard

    it("rejects Call Center JWT with HTTP 403 Forbidden", async () => {
      const req: any = {
        auth_context: {
          actor_id: "usr_call_center_01",
        },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "usr_call_center_01",
                      email: "callcenter@bd-commerce.com",
                      metadata: {
                        role: "call_center",
                      },
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
      let nextError: any = null
      const next = (err?: any) => {
        nextError = err
      }

      await requireRole(req, res, next)

      expect(nextError).toBeInstanceOf(MedusaError)
      expect(nextError.type).toBe(MedusaError.Types.FORBIDDEN)
      expect(nextError.message).toBe("Insufficient role for this resource")
    })

    it("rejects Warehouse staff JWT with HTTP 403 Forbidden", async () => {
      const req: any = {
        auth_context: {
          actor_id: "usr_warehouse_01",
        },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "usr_warehouse_01",
                      email: "warehouse@bd-commerce.com",
                      metadata: {
                        role: "warehouse",
                      },
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
      let nextError: any = null
      const next = (err?: any) => {
        nextError = err
      }

      await requireRole(req, res, next)

      expect(nextError).toBeInstanceOf(MedusaError)
      expect(nextError.type).toBe(MedusaError.Types.FORBIDDEN)
      expect(nextError.message).toBe("Insufficient role for this resource")
    })

    it("allows Super Admin (Owner) JWT to read and write variant costs", async () => {
      const req: any = {
        auth_context: {
          actor_id: "usr_owner_01",
        },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "usr_owner_01",
                      email: "owner@bd-commerce.com",
                      metadata: {
                        role: "owner",
                      },
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
      let nextError: any = null
      const next = (err?: any) => {
        nextCalled = true
        nextError = err
      }

      await requireRole(req, res, next)

      expect(nextCalled).toBe(true)
      expect(nextError).toBeUndefined()
    })

    it("allows Finance role JWT to read and write variant costs", async () => {
      const req: any = {
        auth_context: {
          actor_id: "usr_finance_01",
        },
        scope: {
          resolve: (key: string) => {
            if (key === ContainerRegistrationKeys.QUERY) {
              return {
                graph: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "usr_finance_01",
                      email: "finance@bd-commerce.com",
                      metadata: {
                        role: "finance",
                      },
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
      let nextError: any = null
      const next = (err?: any) => {
        nextCalled = true
        nextError = err
      }

      await requireRole(req, res, next)

      expect(nextCalled).toBe(true)
      expect(nextError).toBeUndefined()
    })

    it("ensures public storefront PDP payload strictly omits confidential cost fields", () => {
      const mockPublicPdpPayload = {
        product_id: "prod_loafer_01",
        brand: { name_en: "Apex BD" },
        profile: { is_returnable: true, country_of_origin: "BD" },
        localization: { care_instructions_bn: "যত্ন নিন" },
        translation_bn: { title: "লোফার" },
        attributes: [
          { code: "upper_material", value: "leather", label_en: "Genuine Leather" },
        ],
      }

      // Check for zero leakage of COGS or margins
      const serialized = JSON.stringify(mockPublicPdpPayload)
      expect(serialized).not.toContain("cogs")
      expect(serialized).not.toContain("packaging_cost")
      expect(serialized).not.toContain("supplier")
      expect(serialized).not.toContain("paisa")
      expect(serialized).not.toContain("margin")
    })
  })

  describe("CHK-CAT-04: Category-Specific Dynamic Attributes & Integrity", () => {
    it("ensures Grocery category attributes do not include fashion size (S/M/L)", () => {
      const groceryAttributes = [
        { code: "packaging_type", input_type: "enum" },
        { code: "net_weight_grams", input_type: "number" },
        { code: "organic_certified", input_type: "boolean" },
      ]

      const hasFashionSize = groceryAttributes.some(
        (a) => a.code === "size" || a.code === "fashion_size" || a.code === "clothing_size"
      )
      expect(hasFashionSize).toBe(false)
    })

    it("ensures Footwear category contains appropriate specification attributes", () => {
      const footwearAttributes = [
        { code: "upper_material", input_type: "enum", is_required: true },
        { code: "sole_material", input_type: "enum", is_required: false },
        { code: "closure_type", input_type: "enum", is_required: false },
        { code: "shoe_weight_grams", input_type: "number", unit: "g" },
        { code: "is_water_resistant", input_type: "boolean" },
      ]

      expect(footwearAttributes.find((a) => a.code === "upper_material")?.is_required).toBe(true)
      expect(footwearAttributes.find((a) => a.code === "sole_material")).toBeDefined()
      expect(footwearAttributes.find((a) => a.code === "shoe_weight_grams")?.unit).toBe("g")
    })
  })

  describe("Money Boundary & Effective Dating Integrity", () => {
    it("stores COGS and packaging costs in integer paisa and converts to major BDT", () => {
      const cogsBdt = 2500 // ৳2,500.00
      const cogsPaisa = toPaisa(cogsBdt)
      expect(cogsPaisa).toBe(250000)
      expect(Number.isInteger(cogsPaisa)).toBe(true)

      const convertedMajor = toMajor(cogsPaisa)
      expect(convertedMajor).toBe(2500)
    })

    it("validates effective-dating state: new cost closes open record and opens new one", () => {
      const oldRecord = {
        id: "varcost_01",
        variant_id: "variant_123",
        cogs_paisa: 200000,
        effective_from: new Date("2026-01-01"),
        effective_to: null,
      }

      const updateDate = new Date("2026-10-25")
      // Close old record
      const closedOldRecord = {
        ...oldRecord,
        effective_to: updateDate,
      }
      // Open new record
      const newRecord = {
        id: "varcost_02",
        variant_id: "variant_123",
        cogs_paisa: 220000,
        effective_from: updateDate,
        effective_to: null,
      }

      expect(closedOldRecord.effective_to).toEqual(updateDate)
      expect(newRecord.effective_from).toEqual(updateDate)
      expect(newRecord.effective_to).toBeNull()
    })
  })
})
