import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles, Plus, ArrowPath, DocumentText, CheckCircleSolid, XCircleSolid } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
  FocusModal,
  Select,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { bdClient } from "../../lib/bd-client"

type LandingPageItem = {
  id: string
  slug: string
  title_en: string
  title_bn: string | null
  status: "draft" | "published" | "unpublished"
  checkout_mode: "embedded" | "modal" | "redirect"
  default_locale: string
  versions_count: number
  offers_count: number
  published_at: string | null
  created_at: string
}

type LandingPagesResponse = {
  landing_pages: LandingPageItem[]
  count: number
}

export default function LandingPagesPage() {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleBn, setTitleBn] = useState("")
  const [checkoutMode, setCheckoutMode] = useState("embedded")

  const { data, isLoading } = useQuery<LandingPagesResponse>({
    queryKey: ["admin-landing-pages"],
    queryFn: () => bdClient.fetch<LandingPagesResponse>("/admin/landing-pages"),
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (body: any) => bdClient.post("/admin/landing-pages", body),
    onSuccess: () => {
      toast.success("Success", { description: "Landing page draft created successfully." })
      setCreateModalOpen(false)
      setSlug("")
      setTitleEn("")
      setTitleBn("")
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] })
    },
    onError: (err: any) => {
      toast.error("Creation Failed", { description: err.message || "Failed to create landing page." })
    },
  })

  // Publish Mutation (AC-5.2)
  const publishMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/landing-pages/${id}/publish`, {}),
    onSuccess: () => {
      toast.success("Published", { description: "Landing page published successfully." })
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] })
    },
    onError: (err: any) => {
      toast.error("Publish Blocked (AC-5.2)", { description: err.message })
    },
  })

  // Unpublish Mutation
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/landing-pages/${id}/unpublish`, {}),
    onSuccess: () => {
      toast.success("Unpublished", { description: "Landing page unpublished and removed from sitemap." })
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  // Duplicate Mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/landing-pages/${id}/duplicate`, {}),
    onSuccess: () => {
      toast.success("Duplicated", { description: "Landing page cloned as a new draft." })
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  // Rollback Mutation (AC-9.2)
  const rollbackMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/landing-pages/${id}/rollback`, {}),
    onSuccess: () => {
      toast.success("Rolled Back (AC-9.2)", { description: "Page rolled back to previous version. Orders intact." })
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge color="green">Published</Badge>
      case "unpublished":
        return <Badge color="red">Unpublished</Badge>
      default:
        return <Badge color="grey">Draft</Badge>
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !titleEn) return

    createMutation.mutate({
      slug,
      title_en: titleEn,
      title_bn: titleBn || null,
      checkout_mode: checkoutMode,
      sections_json: [
        {
          section_type: "hero",
          headline: titleEn,
          subheadline: "Special promotional pricing for a limited time.",
        },
        {
          section_type: "embedded_checkout",
        },
      ],
      theme_tokens_json: {
        primary_color: "#059669",
        background_color: "#ffffff",
        text_color: "#0f172a",
      },
    })
  }

  return (
    <Container className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-ui-fg-interactive" />
            <span>Campaign Landing Pages</span>
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Build and publish high-converting campaign landing pages with Mode B direct checkout.
          </Text>
        </div>

        <Button variant="primary" size="small" onClick={() => setCreateModalOpen(true)}>
          <Plus />
          <span>New Landing Page</span>
        </Button>
      </div>

      {/* Pages Table */}
      <div className="border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title / Campaign</Table.HeaderCell>
              <Table.HeaderCell>Slug / URL</Table.HeaderCell>
              <Table.HeaderCell>Checkout Mode</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Versions</Table.HeaderCell>
              <Table.HeaderCell>Offers</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-subtle">
                  Loading landing pages...
                </Table.Cell>
              </Table.Row>
            ) : !data?.landing_pages || data.landing_pages.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-subtle">
                  No landing pages found. Click "New Landing Page" to create your first campaign.
                </Table.Cell>
              </Table.Row>
            ) : (
              data.landing_pages.map((lp) => (
                <Table.Row key={lp.id}>
                  <Table.Cell>
                    <div className="font-semibold text-ui-fg-base">{lp.title_en}</div>
                    {lp.title_bn && <div className="text-xs text-ui-fg-subtle">{lp.title_bn}</div>}
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-xs bg-ui-bg-subtle px-2 py-1 rounded">/lp/{lp.slug}</code>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{lp.checkout_mode}</Badge>
                  </Table.Cell>
                  <Table.Cell>{getStatusBadge(lp.status)}</Table.Cell>
                  <Table.Cell>
                    <span className="font-mono text-xs">{lp.versions_count || 0}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-mono text-xs">{lp.offers_count || 0}</span>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lp.status !== "published" ? (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => publishMutation.mutate(lp.id)}
                          disabled={publishMutation.isPending}
                        >
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => unpublishMutation.mutate(lp.id)}
                          disabled={unpublishMutation.isPending}
                        >
                          Unpublish
                        </Button>
                      )}

                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => duplicateMutation.mutate(lp.id)}
                        disabled={duplicateMutation.isPending}
                      >
                        Duplicate
                      </Button>

                      {lp.versions_count > 1 && (
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => rollbackMutation.mutate(lp.id)}
                          disabled={rollbackMutation.isPending}
                        >
                          Rollback
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Create Modal */}
      <FocusModal open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
          </FocusModal.Header>
          <div className="max-w-xl mx-auto py-12 px-6">
            <Heading level="h2" className="text-xl font-bold mb-2">
              Create Campaign Landing Page
            </Heading>
            <Text className="text-ui-fg-subtle text-sm mb-6">
              Enter page titles and unique URL handle. Mode B embedded checkout will be configured automatically.
            </Text>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="slug" className="text-xs font-semibold uppercase">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  required
                  placeholder="e.g. panjabi-eid-offer"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="titleEn" className="text-xs font-semibold uppercase">
                  Title (English) *
                </Label>
                <Input
                  id="titleEn"
                  required
                  placeholder="e.g. Premium Tangail Cotton Panjabi Special"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="titleBn" className="text-xs font-semibold uppercase">
                  Title (Bangla)
                </Label>
                <Input
                  id="titleBn"
                  placeholder="যেমন: প্রিমিয়াম টাঙ্গাইল সুতি পাঞ্জাবি স্পেশাল"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Draft Page"}
                </Button>
              </div>
            </form>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Landing Pages",
  icon: Sparkles,
  rank: 20,
})
