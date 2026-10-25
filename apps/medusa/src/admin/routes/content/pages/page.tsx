import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Newspaper, Plus, ArrowPath } from "@medusajs/icons"
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

type ContentPageItem = {
  id: string
  slug: string
  page_type: string
  title_en: string
  title_bn: string | null
  status: "draft" | "published" | "unpublished"
  published_at: string | null
  updated_at: string
}

type PagesResponse = {
  pages: ContentPageItem[]
  count: number
}

export default function ContentPagesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleBn, setTitleBn] = useState("")
  const [pageType, setPageType] = useState("policy")
  const [bodyEn, setBodyEn] = useState("")
  const [bodyBn, setBodyBn] = useState("")

  const { data, isLoading } = useQuery<PagesResponse>({
    queryKey: ["admin-content-pages"],
    queryFn: () => bdClient.fetch<PagesResponse>("/admin/content/pages"),
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => bdClient.post("/admin/content/pages", body),
    onSuccess: () => {
      toast.success("Page Created", { description: "Policy page draft created successfully." })
      setModalOpen(false)
      setSlug("")
      setTitleEn("")
      setTitleBn("")
      setBodyEn("")
      setBodyBn("")
      queryClient.invalidateQueries({ queryKey: ["admin-content-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/content/pages/${id}`, { action: "publish" }),
    onSuccess: () => {
      toast.success("Published", { description: "Policy page published successfully." })
      queryClient.invalidateQueries({ queryKey: ["admin-content-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => bdClient.post(`/admin/content/pages/${id}`, { action: "rollback" }),
    onSuccess: () => {
      toast.success("Rolled Back (AC-9.2)", { description: "Page rolled back to last published version." })
      queryClient.invalidateQueries({ queryKey: ["admin-content-pages"] })
    },
    onError: (err: any) => {
      toast.error("Error", { description: err.message })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      slug,
      title_en: titleEn,
      title_bn: titleBn || null,
      page_type: pageType,
      body_en: bodyEn || null,
      body_bn: bodyBn || null,
      status: "draft",
    })
  }

  return (
    <Container className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="text-ui-fg-interactive" />
            <span>Policy & Informational Pages</span>
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage store policy pages (Terms, Privacy, Returns, About, Contact) with draft and rollback controls (FR-9.5).
          </Text>
        </div>

        <Button variant="primary" size="small" onClick={() => setModalOpen(true)}>
          <Plus />
          <span>New Page</span>
        </Button>
      </div>

      <div className="border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title (English)</Table.HeaderCell>
              <Table.HeaderCell>Title (Bangla)</Table.HeaderCell>
              <Table.HeaderCell>Slug / Route</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">
                  Loading policy pages...
                </Table.Cell>
              </Table.Row>
            ) : !data?.pages || data.pages.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">
                  No policy pages created yet. Click "New Page" to create one.
                </Table.Cell>
              </Table.Row>
            ) : (
              data.pages.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <span className="font-semibold text-ui-fg-base">{p.title_en}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-ui-fg-subtle">{p.title_bn || "—"}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-xs bg-ui-bg-subtle px-2 py-0.5 rounded">/pages/{p.slug}</code>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{p.page_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {p.status === "published" ? (
                      <Badge color="green">Published</Badge>
                    ) : (
                      <Badge color="grey">Draft</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status !== "published" && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => publishMutation.mutate(p.id)}
                          disabled={publishMutation.isPending}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => rollbackMutation.mutate(p.id)}
                        disabled={rollbackMutation.isPending}
                      >
                        Rollback
                      </Button>
                    </div>
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
              Create Policy Page
            </Heading>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="slug" className="text-xs font-semibold uppercase">
                  Slug *
                </Label>
                <Input
                  id="slug"
                  required
                  placeholder="e.g. return-refund-policy, terms, privacy"
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
                  placeholder="e.g. Return & Refund Policy"
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
                  placeholder="যেমন: রিটার্ন ও রিফান্ড নীতিমালা"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bodyEn" className="text-xs font-semibold uppercase">
                  Content Body (English HTML)
                </Label>
                <textarea
                  id="bodyEn"
                  rows={4}
                  placeholder="<p>Full policy text in English...</p>"
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-ui-border-base bg-ui-bg-base text-sm outline-none focus:border-ui-border-interactive"
                />
              </div>

              <div>
                <Label htmlFor="bodyBn" className="text-xs font-semibold uppercase">
                  Content Body (Bangla HTML)
                </Label>
                <textarea
                  id="bodyBn"
                  rows={4}
                  placeholder="<p>বাংলায় বিস্তারিত নীতিমালা...</p>"
                  value={bodyBn}
                  onChange={(e) => setBodyBn(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-ui-border-base bg-ui-bg-base text-sm outline-none focus:border-ui-border-interactive"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Draft"}
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
  label: "Policy Pages",
  icon: Newspaper,
  rank: 22,
})
