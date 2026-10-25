import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Text,
  Textarea,
  Tooltip,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { bdClient } from "../lib/bd-client"

type Brand = {
  id: string
  name_en: string
  name_bn: string | null
  slug: string
}

type CategoryAttributeOption = {
  id: string
  value_code: string
  label_en: string
  label_bn: string
}

type CategoryAttribute = {
  id: string
  code: string
  name_en: string
  name_bn: string
  input_type: "text" | "number" | "enum" | "boolean"
  unit: string | null
  help_text_en: string | null
  help_text_bn: string | null
  is_required: boolean
  options: CategoryAttributeOption[]
  current_value: {
    id: string
    value_text: string | null
    value_number: number | null
    value_boolean: boolean | null
    value_code_ref: string | null
  } | null
}

type VariantCost = {
  variant_id: string
  title: string
  sku: string
  cost: {
    id: string
    cogs_bdt: number
    packaging_cost_bdt: number
    estimated_shipping_cost_bdt: number
    supplier_name: string | null
    supplier_sku: string | null
    minimum_margin_percent: number
    effective_from: string
    change_reason: string | null
  } | null
}

export default function ProductBdProfileWidget({ data }: { data: any }) {
  const queryClient = useQueryClient()
  const productId = data?.id
  const optionTypesCount = data?.options?.length || 0
  const isPublished = data?.status === "published"

  const [activeTab, setActiveTab] = useState<"bangla" | "attributes" | "profile" | "costs">("bangla")

  // 1. Fetch Brands
  const { data: brandsData } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => bdClient.fetch<{ brands: Brand[] }>("/admin/brands"),
  })

  // 2. Fetch Product Brand
  const { data: productBrandData } = useQuery({
    queryKey: ["admin-product-brand", productId],
    queryFn: () =>
      bdClient.fetch<{ brand: Brand | null }>(`/admin/products/${productId}/brand`),
    enabled: Boolean(productId),
  })

  // 3. Fetch Localization & Native BN Translations
  const { data: locData } = useQuery({
    queryKey: ["admin-product-localization", productId],
    queryFn: () =>
      bdClient.fetch<any>(`/admin/products/${productId}/localization`),
    enabled: Boolean(productId),
  })

  // 4. Fetch BD Profile
  const { data: profileData } = useQuery({
    queryKey: ["admin-product-profile", productId],
    queryFn: () =>
      bdClient.fetch<{ profile: any }>(`/admin/products/${productId}/profile`),
    enabled: Boolean(productId),
  })

  // 5. Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: () =>
      bdClient.fetch<{ product_categories: any[] }>("/admin/product-categories").catch(() => ({ product_categories: [] })),
  })

  // 6. Active Category for Attributes
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  useEffect(() => {
    if (profileData?.profile?.primary_category_id) {
      setSelectedCategoryId(profileData.profile.primary_category_id)
    } else if (data?.categories?.[0]?.id) {
      setSelectedCategoryId(data.categories[0].id)
    }
  }, [profileData, data])

  // 7. Fetch Category Attributes
  const { data: attributesData, isLoading: attributesLoading } = useQuery({
    queryKey: ["admin-product-attributes", productId, selectedCategoryId],
    queryFn: () =>
      bdClient.fetch<{ category_id: string; attributes: CategoryAttribute[] }>(
        `/admin/products/${productId}/attributes?category_id=${selectedCategoryId}`
      ),
    enabled: Boolean(productId && selectedCategoryId),
  })

  // 8. Fetch Variant Costs (Owner/Finance only - server side gated)
  const { data: costsData, error: costsError, isLoading: costsLoading } = useQuery({
    queryKey: ["admin-product-variant-costs", productId],
    queryFn: () =>
      bdClient.fetch<{ costs: VariantCost[] }>(`/admin/products/${productId}/variants/costs`),
    enabled: Boolean(productId),
    retry: false,
  })

  // Form States - Bangla
  const [titleBn, setTitleBn] = useState("")
  const [descBn, setDescBn] = useState("")
  const [careInstructionsBn, setCareInstructionsBn] = useState("")
  const [originCountryBn, setOriginCountryBn] = useState("")
  const [excerptBn, setExcerptBn] = useState("")
  const [metaTitleBn, setMetaTitleBn] = useState("")
  const [metaDescriptionBn, setMetaDescriptionBn] = useState("")

  // Form States - Commercial Profile & Brand
  const [selectedBrandId, setSelectedBrandId] = useState<string>("none")
  const [isReturnable, setIsReturnable] = useState(true)
  const [isCodAllowed, setIsCodAllowed] = useState(true)
  const [warrantyNoteEn, setWarrantyNoteEn] = useState("")
  const [warrantyNoteBn, setWarrantyNoteBn] = useState("")
  const [originNoteEn, setOriginNoteEn] = useState("")
  const [originNoteBn, setOriginNoteBn] = useState("")
  const [minOrderQty, setMinOrderQty] = useState<string>("")
  const [maxOrderQty, setMaxOrderQty] = useState<string>("")

  // Form States - Dynamic Attributes
  const [attributeFormValues, setAttributeFormValues] = useState<Record<string, any>>({})

  // Form States - Variant Costs
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [costCogsBdt, setCostCogsBdt] = useState<string>("")
  const [costPackagingBdt, setCostPackagingBdt] = useState<string>("")
  const [costMarginPercent, setCostMarginPercent] = useState<string>("20")
  const [costSupplierName, setCostSupplierName] = useState<string>("")
  const [costSupplierSku, setCostSupplierSku] = useState<string>("")
  const [costChangeReason, setCostChangeReason] = useState<string>("")

  useEffect(() => {
    if (productBrandData?.brand) {
      setSelectedBrandId(productBrandData.brand.id)
    } else {
      setSelectedBrandId("none")
    }
  }, [productBrandData])

  useEffect(() => {
    if (locData) {
      const trans: any = locData.native_translation
      const t = trans?.translations || trans?.values || {}
      setTitleBn(t.title || "")
      setDescBn(t.description || "")
      setCareInstructionsBn(locData.localization?.care_instructions_bn || "")
      setOriginCountryBn(locData.localization?.origin_country_bn || "")
      setExcerptBn(locData.localization?.description_excerpt_bn || "")
      setMetaTitleBn(locData.localization?.meta_title_bn || "")
      setMetaDescriptionBn(locData.localization?.meta_description_bn || "")
    }
  }, [locData])

  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile
      setIsReturnable(p.is_returnable ?? true)
      setIsCodAllowed(p.is_cod_allowed ?? true)
      setWarrantyNoteEn(p.warranty_note_en || "")
      setWarrantyNoteBn(p.warranty_note_bn || "")
      setOriginNoteEn(p.origin_note_en || "")
      setOriginNoteBn(p.origin_note_bn || "")
      setMinOrderQty(p.min_order_qty !== null ? String(p.min_order_qty) : "")
      setMaxOrderQty(p.max_order_qty !== null ? String(p.max_order_qty) : "")
    }
  }, [profileData])

  useEffect(() => {
    if (attributesData?.attributes) {
      const initial: Record<string, any> = {}
      for (const attr of attributesData.attributes) {
        if (attr.current_value) {
          if (attr.input_type === "number") {
            initial[attr.code] = attr.current_value.value_number ?? ""
          } else if (attr.input_type === "boolean") {
            initial[attr.code] = attr.current_value.value_boolean ?? false
          } else if (attr.input_type === "enum") {
            initial[attr.code] = attr.current_value.value_code_ref || attr.current_value.value_text || ""
          } else {
            initial[attr.code] = attr.current_value.value_text || ""
          }
        } else {
          initial[attr.code] = attr.input_type === "boolean" ? false : ""
        }
      }
      setAttributeFormValues(initial)
    }
  }, [attributesData])

  // Save Brand Mutation
  const brandMutation = useMutation({
    mutationFn: (brandId: string | null) =>
      bdClient.post(`/admin/products/${productId}/brand`, {
        brand_id: brandId === "none" ? null : brandId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-brand", productId] })
    },
  })

  // Save Localization Mutation
  const locMutation = useMutation({
    mutationFn: (payload: any) =>
      bdClient.post(`/admin/products/${productId}/localization`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-product-localization", productId],
      })
      toast.success("Bangla localization saved")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save localization")
    },
  })

  // Save Profile Mutation
  const profileMutation = useMutation({
    mutationFn: (payload: any) =>
      bdClient.post(`/admin/products/${productId}/profile`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-profile", productId] })
      toast.success("Commercial profile saved")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save profile")
    },
  })

  // Save Attributes Mutation
  const attributesMutation = useMutation({
    mutationFn: (payload: any) =>
      bdClient.post(`/admin/products/${productId}/attributes`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-product-attributes", productId, selectedCategoryId],
      })
      toast.success("Category attributes saved successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save attributes")
    },
  })

  // Save Variant Cost Mutation
  const costMutation = useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: any }) =>
      bdClient.post(`/admin/products/${productId}/variants/${variantId}/cost`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-variant-costs", productId] })
      setEditingVariantId(null)
      toast.success("Variant cost updated")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update variant cost")
    },
  })

  const isReviewed = Boolean(locData?.localization?.is_reviewed)
  const isMissingBn = isPublished && (!titleBn.trim() || !descBn.trim())

  const handleSaveLocalization = () => {
    locMutation.mutate({
      title_bn: titleBn,
      description_bn: descBn,
      care_instructions_bn: careInstructionsBn,
      origin_country_bn: originCountryBn,
      description_excerpt_bn: excerptBn,
      meta_title_bn: metaTitleBn,
      meta_description_bn: metaDescriptionBn,
    })
  }

  const handleMarkAsReviewed = () => {
    locMutation.mutate({
      is_reviewed: true,
      title_bn: titleBn,
      description_bn: descBn,
      care_instructions_bn: careInstructionsBn,
      origin_country_bn: originCountryBn,
      description_excerpt_bn: excerptBn,
      meta_title_bn: metaTitleBn,
      meta_description_bn: metaDescriptionBn,
    })
  }

  const handleSaveProfile = async () => {
    await brandMutation.mutateAsync(selectedBrandId)
    profileMutation.mutate({
      primary_category_id: selectedCategoryId || null,
      is_returnable: isReturnable,
      is_cod_allowed: isCodAllowed,
      warranty_note_en: warrantyNoteEn || null,
      warranty_note_bn: warrantyNoteBn || null,
      origin_note_en: originNoteEn || null,
      origin_note_bn: originNoteBn || null,
      min_order_qty: minOrderQty ? parseInt(minOrderQty, 10) : null,
      max_order_qty: maxOrderQty ? parseInt(maxOrderQty, 10) : null,
    })
  }

  const handleSaveAttributes = () => {
    attributesMutation.mutate({
      category_id: selectedCategoryId,
      values: attributeFormValues,
    })
  }

  const handleSaveCost = (variantId: string) => {
    costMutation.mutate({
      variantId,
      payload: {
        cogs_bdt: parseFloat(costCogsBdt || "0"),
        packaging_cost_bdt: parseFloat(costPackagingBdt || "0"),
        minimum_margin_percent: parseFloat(costMarginPercent || "20"),
        supplier_name: costSupplierName || null,
        supplier_sku: costSupplierSku || null,
        change_reason: costChangeReason || null,
      },
    })
  }

  const isCostForbidden = (costsError as any)?.status === 403

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Heading level="h2">Bangladesh Product Profile</Heading>
          <Tooltip content="Medusa BD Catalog enforces a hard ceiling of max 3 variant option types per product (e.g. Size, Color, Material).">
            <Badge color={optionTypesCount === 3 ? "orange" : "blue"}>
              {optionTypesCount} / 3 option types used
            </Badge>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {isReviewed ? (
            <Badge color="green">reviewed</Badge>
          ) : (
            <Badge color="grey">draft</Badge>
          )}

          {!isReviewed && (
            <Button
              size="small"
              variant="secondary"
              onClick={handleMarkAsReviewed}
              disabled={locMutation.isPending}
            >
              Mark as Reviewed
            </Button>
          )}
        </div>
      </div>

      {/* Publish completeness warning */}
      {isMissingBn && (
        <div className="bg-ui-bg-subtle-pressed border-l-4 border-amber-500 px-6 py-3 text-amber-800 dark:text-amber-200">
          <Text size="small" className="font-medium">
            ⚠️ Product is Published, but Bangla title or description is missing.
            Add Bangla translations to ensure full storefront completeness.
          </Text>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b px-6 py-2 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("bangla")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "bangla"
              ? "border-ui-fg-base text-ui-fg-base"
              : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
          }`}
        >
          Bangla Localization
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("attributes")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "attributes"
              ? "border-ui-fg-base text-ui-fg-base"
              : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
          }`}
        >
          Category Attributes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-ui-fg-base text-ui-fg-base"
              : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
          }`}
        >
          Commercial & Brand Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("costs")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            activeTab === "costs"
              ? "border-ui-fg-base text-ui-fg-base"
              : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
          }`}
        >
          Unit Cost (COGS)
        </button>
      </div>

      {/* 1. Bangla Tab Content */}
      {activeTab === "bangla" && (
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Bangla Title (নাম - বাংলা)
              </Text>
              <Input
                placeholder="যেমন: পুরুষদের সুতি পাঞ্জাবি"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
              />
            </div>

            <div>
              <Text size="small" weight="plus" className="mb-1">
                Bangla Short Excerpt (সংক্ষেপ বিবরণ)
              </Text>
              <Input
                placeholder="পণ্যের সংক্ষিপ্ত বিবরণ"
                value={excerptBn}
                onChange={(e) => setExcerptBn(e.target.value)}
              />
            </div>

            <div>
              <Text size="small" weight="plus" className="mb-1">
                Bangla Description (বিস্তারিত বিবরণ)
              </Text>
              <Textarea
                placeholder="বিস্তারিত পণ্যের বিবরণ..."
                rows={3}
                value={descBn}
                onChange={(e) => setDescBn(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Care Instructions (যত্নের নির্দেশিকা)
                </Text>
                <Input
                  placeholder="যেমন: ঠাণ্ডা পানিতে হাত দিয়ে ধোবেন"
                  value={careInstructionsBn}
                  onChange={(e) => setCareInstructionsBn(e.target.value)}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Origin Country (উৎপাদনকারী দেশ)
                </Text>
                <Input
                  placeholder="যেমন: বাংলাদেশ"
                  value={originCountryBn}
                  onChange={(e) => setOriginCountryBn(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Meta Title (বাংলা এসইও টাইটেল)
                </Text>
                <Input
                  placeholder="এসইও শিরোনাম"
                  value={metaTitleBn}
                  onChange={(e) => setMetaTitleBn(e.target.value)}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Meta Description (বাংলা এসইও মেটা ডেসক্রিপশন)
                </Text>
                <Input
                  placeholder="এসইও বর্ণনা"
                  value={metaDescriptionBn}
                  onChange={(e) => setMetaDescriptionBn(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="small"
              onClick={handleSaveLocalization}
              disabled={locMutation.isPending}
            >
              {locMutation.isPending ? "Saving..." : "Save Bangla Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* 2. Category Attributes Tab Content */}
      {activeTab === "attributes" && (
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <Text size="small" weight="plus">
                Select Category For Dynamic Attributes
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                Attributes adapt dynamically based on selected product category (PRD FR-3.1.1, AC-3.3).
              </Text>
            </div>
            <select
              className="rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-sm"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">-- Choose Category --</option>
              {categoriesData?.product_categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedCategoryId ? (
            <div className="py-6 text-center text-ui-fg-muted text-sm">
              Please select a category above to load its attribute specifications.
            </div>
          ) : attributesLoading ? (
            <div className="py-6 text-center text-ui-fg-muted text-sm">
              Loading category attributes...
            </div>
          ) : !attributesData?.attributes || attributesData.attributes.length === 0 ? (
            <div className="py-6 text-center text-ui-fg-muted text-sm">
              No custom attributes configured for this category yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attributesData.attributes.map((attr) => (
                  <div key={attr.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Text size="small" weight="plus">
                        {attr.name_en} ({attr.name_bn})
                        {attr.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Text>
                      {attr.unit && (
                        <Badge size="small" color="grey">
                          {attr.unit}
                        </Badge>
                      )}
                    </div>

                    {attr.help_text_en && (
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {attr.help_text_en}
                      </Text>
                    )}

                    {attr.input_type === "enum" ? (
                      <select
                        className="w-full rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-sm"
                        value={attributeFormValues[attr.code] || ""}
                        onChange={(e) =>
                          setAttributeFormValues((prev) => ({
                            ...prev,
                            [attr.code]: e.target.value,
                          }))
                        }
                      >
                        <option value="">-- Select option --</option>
                        {attr.options?.map((opt) => (
                          <option key={opt.id} value={opt.value_code}>
                            {opt.label_en} ({opt.label_bn})
                          </option>
                        ))}
                      </select>
                    ) : attr.input_type === "boolean" ? (
                      <div className="pt-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`attr-${attr.id}`}
                          checked={Boolean(attributeFormValues[attr.code])}
                          onChange={(e) =>
                            setAttributeFormValues((prev) => ({
                              ...prev,
                              [attr.code]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-ui-border-base text-ui-fg-interactive"
                        />
                        <label htmlFor={`attr-${attr.id}`} className="text-sm">
                          Yes / হ্যাঁ
                        </label>
                      </div>
                    ) : attr.input_type === "number" ? (
                      <Input
                        type="number"
                        placeholder={attr.unit ? `e.g. 500 (${attr.unit})` : "Enter number"}
                        value={attributeFormValues[attr.code] !== undefined ? attributeFormValues[attr.code] : ""}
                        onChange={(e) =>
                          setAttributeFormValues((prev) => ({
                            ...prev,
                            [attr.code]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        placeholder="Enter value"
                        value={attributeFormValues[attr.code] || ""}
                        onChange={(e) =>
                          setAttributeFormValues((prev) => ({
                            ...prev,
                            [attr.code]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleSaveAttributes}
                  disabled={attributesMutation.isPending}
                >
                  {attributesMutation.isPending ? "Saving..." : "Save Category Attributes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Commercial & Brand Profile Tab */}
      {activeTab === "profile" && (
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Associated Brand
              </Text>
              <select
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-sm"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
              >
                <option value="none">-- No Brand --</option>
                {brandsData?.brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name_en} {b.name_bn ? `(${b.name_bn})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Text size="small" weight="plus" className="mb-1">
                Primary Category
              </Text>
              <select
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-sm"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">-- No Category --</option>
                {categoriesData?.product_categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t space-y-4">
            <div className="flex items-start justify-between p-3 rounded-md border bg-ui-bg-subtle">
              <div>
                <Text size="small" weight="plus">
                  Returnable Product (ফেরতযোগ্য পণ্য)
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Hard override: If disabled (false), return requests are prohibited regardless of general category return policies (Prompt 04 §3).
                </Text>
              </div>
              <input
                type="checkbox"
                checked={isReturnable}
                onChange={(e) => setIsReturnable(e.target.checked)}
                className="h-5 w-5 rounded border-ui-border-base text-ui-fg-interactive"
              />
            </div>

            <div className="flex items-start justify-between p-3 rounded-md border bg-ui-bg-subtle">
              <div>
                <Text size="small" weight="plus">
                  COD Allowed (ক্যাশ অন ডেলিভারি প্রযোজ্য)
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Can be disabled for high-value or custom fragile items.
                </Text>
              </div>
              <input
                type="checkbox"
                checked={isCodAllowed}
                onChange={(e) => setIsCodAllowed(e.target.checked)}
                className="h-5 w-5 rounded border-ui-border-base text-ui-fg-interactive"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Warranty Note (EN)
                </Text>
                <Input
                  placeholder="e.g. 6 Months Official Warranty"
                  value={warrantyNoteEn}
                  onChange={(e) => setWarrantyNoteEn(e.target.value)}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Warranty Note (BN)
                </Text>
                <Input
                  placeholder="যেমন: ৬ মাসের অফিসিয়াল ওয়ারেন্টি"
                  value={warrantyNoteBn}
                  onChange={(e) => setWarrantyNoteBn(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Origin / Material Note (EN)
                </Text>
                <Input
                  placeholder="e.g. Handcrafted in Narayanganj"
                  value={originNoteEn}
                  onChange={(e) => setOriginNoteEn(e.target.value)}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Origin / Material Note (BN)
                </Text>
                <Input
                  placeholder="যেমন: নারায়ণগঞ্জে দক্ষ কারিগর দ্বারা প্রস্তুত"
                  value={originNoteBn}
                  onChange={(e) => setOriginNoteBn(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Min Order Quantity
                </Text>
                <Input
                  type="number"
                  placeholder="Optional (e.g. 1)"
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(e.target.value)}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Max Order Quantity
                </Text>
                <Input
                  type="number"
                  placeholder="Optional (e.g. 5)"
                  value={maxOrderQty}
                  onChange={(e) => setMaxOrderQty(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="small"
              onClick={handleSaveProfile}
              disabled={profileMutation.isPending || brandMutation.isPending}
            >
              {profileMutation.isPending ? "Saving..." : "Save Commercial Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* 4. Unit Cost / COGS & Margins Tab (Strictly Role-Gated) */}
      {activeTab === "costs" && (
        <div className="px-6 py-5 space-y-4">
          {isCostForbidden ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <Text size="small" className="text-amber-900 dark:text-amber-200 font-medium">
                🔒 Restricted Financial Data: Cost of Goods Sold (COGS) and supplier information are strictly restricted to Super Admin (Owner) and Finance roles (CHK-CAT-07). Access is blocked for Call Center and Warehouse staff.
              </Text>
            </div>
          ) : costsLoading ? (
            <div className="py-6 text-center text-ui-fg-muted text-sm">
              Loading variant cost data...
            </div>
          ) : !costsData?.costs || costsData.costs.length === 0 ? (
            <div className="py-6 text-center text-ui-fg-muted text-sm">
              No variants found for this product.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size="small" weight="plus">
                    Variant Cost & Margin Management
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Effective-dated records. Values entered in BDT major units are stored as integer paisa in custom tables (agent.md §3.6).
                  </Text>
                </div>
              </div>

              <div className="divide-y rounded-md border">
                {costsData.costs.map((vc) => (
                  <div key={vc.variant_id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text size="small" weight="plus">
                          {vc.title} ({vc.sku})
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          Variant ID: {vc.variant_id}
                        </Text>
                      </div>

                      {vc.cost ? (
                        <div className="flex items-center gap-3">
                          <Badge color="blue">
                            COGS: ৳{vc.cost.cogs_bdt.toFixed(2)}
                          </Badge>
                          <Badge color="grey">
                            Packaging: ৳{vc.cost.packaging_cost_bdt.toFixed(2)}
                          </Badge>
                          <Badge color="green">
                            Min Margin: {vc.cost.minimum_margin_percent}%
                          </Badge>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => {
                              setEditingVariantId(vc.variant_id)
                              setCostCogsBdt(String(vc.cost?.cogs_bdt || ""))
                              setCostPackagingBdt(String(vc.cost?.packaging_cost_bdt || ""))
                              setCostMarginPercent(String(vc.cost?.minimum_margin_percent || "20"))
                              setCostSupplierName(vc.cost?.supplier_name || "")
                              setCostSupplierSku(vc.cost?.supplier_sku || "")
                              setCostChangeReason("")
                            }}
                          >
                            Edit Cost
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            setEditingVariantId(vc.variant_id)
                            setCostCogsBdt("")
                            setCostPackagingBdt("")
                            setCostMarginPercent("20")
                            setCostSupplierName("")
                            setCostSupplierSku("")
                            setCostChangeReason("Initial cost setup")
                          }}
                        >
                          Set Cost
                        </Button>
                      )}
                    </div>

                    {/* Edit Drawer / Inline Form */}
                    {editingVariantId === vc.variant_id && (
                      <div className="mt-3 rounded-md border bg-ui-bg-subtle p-4 space-y-3">
                        <Text size="small" weight="plus">
                          Update Effective Cost for {vc.title}
                        </Text>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Text size="xsmall" className="mb-1">
                              COGS (৳ BDT)
                            </Text>
                            <Input
                              type="number"
                              placeholder="e.g. 1500"
                              value={costCogsBdt}
                              onChange={(e) => setCostCogsBdt(e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="xsmall" className="mb-1">
                              Packaging Cost (৳ BDT)
                            </Text>
                            <Input
                              type="number"
                              placeholder="e.g. 50"
                              value={costPackagingBdt}
                              onChange={(e) => setCostPackagingBdt(e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="xsmall" className="mb-1">
                              Minimum Margin %
                            </Text>
                            <Input
                              type="number"
                              placeholder="e.g. 20"
                              value={costMarginPercent}
                              onChange={(e) => setCostMarginPercent(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Text size="xsmall" className="mb-1">
                              Supplier Name
                            </Text>
                            <Input
                              placeholder="e.g. Artisan Mills Ltd"
                              value={costSupplierName}
                              onChange={(e) => setCostSupplierName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="xsmall" className="mb-1">
                              Supplier SKU
                            </Text>
                            <Input
                              placeholder="e.g. SUP-998"
                              value={costSupplierSku}
                              onChange={(e) => setCostSupplierSku(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Text size="xsmall" className="mb-1">
                            Change Reason (Audit trail)
                          </Text>
                          <Input
                            placeholder="e.g. Supplier price renegotiation"
                            value={costChangeReason}
                            onChange={(e) => setCostChangeReason(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => setEditingVariantId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="primary"
                            onClick={() => handleSaveCost(vc.variant_id)}
                            disabled={costMutation.isPending}
                          >
                            {costMutation.isPending ? "Saving..." : "Save Cost Record"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})
