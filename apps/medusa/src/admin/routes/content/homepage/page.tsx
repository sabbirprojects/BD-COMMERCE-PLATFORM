import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront, Plus, ArrowPath } from "@medusajs/icons"
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
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { bdClient } from "../../../lib/bd-client"

type HomepageSectionItem = {
  id: string
  section_type: string
  title_en: string | null
  title_bn: string | null
  subtitle_en: string | null
  sort_order: number
  is_active: boolean
  published_at: string | null
}

type SectionsResponse = {
  sections: HomepageSectionItem[]
  count: number
}

export default function ContentHomepagePage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [sectionType, setSectionType] = useState("hero")
  const [titleEn, setTitleEn] = useState("")
  const [titleBn, setTitleBn] = useState("")
  const [sortOrder, setSortOrder] = useState(0)

  const { data, isLoading } = useQuery<SectionsResponse>({
    queryKey: ["admin-homepage-sections"],
    queryFn: () => bdClient.fetch<SectionsResponse>("/admin/content/homepage"),
  })

  const saveMutation = useMutation({
    mutationFn: (body: any) => bdClient.post("/admin/content/homepage", body),
    onSuccess: () => {
      toast.success("Saved", { description: "Homepage section saved successfully." })
      setModalOpen(false)
      setTitleEn("")
      setTitleBn("")
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-sections"] })
    },
    onError: (err: any) => {
      toast.error("Validation Failed (AC-9.1 / FR-9.6)", { description: err.message })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      section_type: sectionType,
      title_en: titleEn || null,
      title_bn: titleBn || null,
      sort_order: Number(sortOrder) || 0,
      config_json: {
        headline: titleEn,
      },
    })
  }

  return (
    <Container className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold flex items-center gap-2">
            <BuildingStorefront className="text-ui-fg-interactive" />
            <span>Homepage Section Builder</span>
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage, reorder, and configure storefront homepage dynamic sections (FR-9.1).
          </Text>
        </div>

        <Button variant="primary" size="small" onClick={() => setModalOpen(true)}>
          <Plus />
          <span>Add Section</span>
        </Button>
      </div>

      <div className="border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Section Type</Table.HeaderCell>
              <Table.HeaderCell>Title (English)</Table.HeaderCell>
              <Table.HeaderCell>Title (Bangla)</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  Loading sections...
                </Table.Cell>
              </Table.Row>
            ) : !data?.sections || data.sections.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  Default homepage layout is currently active. Add sections to customize.
                </Table.Cell>
              </Table.Row>
            ) : (
              data.sections.map((sec) => (
                <Table.Row key={sec.id}>
                  <Table.Cell>
                    <span className="font-mono text-xs font-bold">{sec.sort_order}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-xs bg-ui-bg-subtle px-2 py-0.5 rounded">{sec.section_type}</code>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-semibold text-ui-fg-base">{sec.title_en || "Untitled"}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-ui-fg-subtle">{sec.title_bn || "—"}</span>
                  </Table.Cell>
                  <Table.Cell>
                    {sec.is_active ? <Badge color="green">Active</Badge> : <Badge color="grey">Hidden</Badge>}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      <FocusModal open={modalOpen} onOpenChange={setModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </FocusModal.Header>
          <div className="max-w-xl mx-auto py-12 px-6">
            <Heading level="h2" className="text-xl font-bold mb-4">
              Add Homepage Section
            </Heading>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="secType" className="text-xs font-semibold uppercase">
                  Section Type *
                </Label>
                <Input
                  id="secType"
                  required
                  placeholder="e.g. hero, category_grid, banner, trust_badges"
                  value={sectionType}
                  onChange={(e) => setSectionType(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="titleEn" className="text-xs font-semibold uppercase">
                  Heading (English)
                </Label>
                <Input
                  id="titleEn"
                  placeholder="e.g. Featured Collection"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="titleBn" className="text-xs font-semibold uppercase">
                  Heading (Bangla)
                </Label>
                <Input
                  id="titleBn"
                  placeholder="যেমন: বিশেষ কালেকশন"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sortOrder" className="text-xs font-semibold uppercase">
                  Sort Order
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={String(sortOrder)}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Section"}
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
  label: "Homepage",
  icon: BuildingStorefront,
  rank: 21,
})
