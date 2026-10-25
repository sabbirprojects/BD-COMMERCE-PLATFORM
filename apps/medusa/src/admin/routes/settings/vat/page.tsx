import { ExclamationCircle, ReceiptPercent } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Prompt,
  Skeleton,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { bdClient } from "../../../lib/bd-client"

type VatSettingsResponse = {
  id: string
  is_vat_enabled: boolean
  registration_status: "unverified" | "verified"
  registration_number: string | null
  prices_include_vat: boolean
  tax_rate_id: string | null
  tax_rate_value: number | null
  legal_note_en: string | null
}

type SaveVatBody = {
  is_vat_enabled: boolean
  prices_include_vat: boolean
}

/**
 * VAT display configuration (architecture.md §15.1, PRD FR-11.4, O-02).
 * The numeric VAT rate lives in native `tax_rate` (shown read-only here —
 * rate maintenance belongs to the native tax screens). This screen edits
 * the bd-settings `vat_settings` display flags only: enable/disable and
 * prices-include-VAT. Registration stays disabled + unverified until the
 * owner's accountant confirms the BIN (O-02) — surfaced as "not yet
 * configured" rather than invented.
 */
export default function SettingsVatPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["bd", "settings", "vat"],
    queryFn: () => bdClient.fetch<VatSettingsResponse>("/admin/settings/vat"),
  })

  const [enabled, setEnabled] = useState(false)
  const [includeVat, setIncludeVat] = useState(false)
  const [guardOpen, setGuardOpen] = useState(false)

  useEffect(() => {
    if (!data) return
    setEnabled(data.is_vat_enabled)
    setIncludeVat(data.prices_include_vat)
  }, [data])

  const isDirty = useMemo(() => {
    if (!data) return false
    return (
      enabled !== data.is_vat_enabled ||
      includeVat !== data.prices_include_vat
    )
  }, [data, enabled, includeVat])

  const saveMutation = useMutation({
    mutationFn: (body: SaveVatBody) =>
      bdClient.post("/admin/settings/vat", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "settings", "vat"] })
      toast.success("VAT settings saved", {
        description: "Display flags updated; the tax rate itself is native.",
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to save VAT settings", { description: err.message })
    },
  })

  const discardChanges = () => {
    if (!data) return
    setEnabled(data.is_vat_enabled)
    setIncludeVat(data.prices_include_vat)
    setGuardOpen(false)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-x-2 px-6 py-4">
        <ReceiptPercent />
        <Heading level="h2">VAT</Heading>
        <Badge size="2xsmall" color="grey" className="ml-auto">
          Display configuration
        </Badge>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-y-3 px-6 py-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-x-2 px-6 py-6">
          <ExclamationCircle className="text-ui-fg-error" />
          <Text size="small" className="text-ui-fg-error">
            {(error as Error).message}
          </Text>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center gap-y-2 px-6 py-12">
          <ReceiptPercent className="text-ui-fg-subtle" />
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            No VAT configuration found
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Run the foundation seed to create the default VAT row.
          </Text>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-y-4 px-6 py-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-[220px_1fr]">
              <Text size="small" weight="plus">
                Registration
              </Text>
              <div className="flex flex-col gap-y-1">
                <div className="flex items-center gap-x-2">
                  <Badge
                    size="2xsmall"
                    color={
                      data.registration_status === "verified"
                        ? "green"
                        : "orange"
                    }
                  >
                    {data.registration_status}
                  </Badge>
                  <Text size="small" className="text-ui-fg-subtle">
                    {data.registration_number
                      ? `BIN ${data.registration_number}`
                      : "Not yet configured (O-02)"}
                  </Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  VAT is disabled and unverified until the owner's accountant
                  confirms the BIN. The system does not assume VAT applies.
                </Text>
              </div>

              <Text size="small" weight="plus">
                VAT rate
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {data.tax_rate_value != null
                  ? `${data.tax_rate_value}% — managed by the native tax module`
                  : "Not yet configured — rate lives in the native tax module"}
              </Text>

              <Text size="small" weight="plus">
                Show VAT in storefront
              </Text>
              <div className="flex items-center gap-x-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {enabled ? "Visible" : "Hidden"}
                </Text>
              </div>

              <Text size="small" weight="plus">
                Prices include VAT
              </Text>
              <div className="flex items-center gap-x-2">
                <Switch
                  checked={includeVat}
                  onCheckedChange={setIncludeVat}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {includeVat
                    ? "Displayed prices are VAT-inclusive"
                    : "Displayed prices exclude VAT (FR-11.4 default)"}
                </Text>
              </div>
            </div>
            {data.legal_note_en ? (
              <Text size="xsmall" className="text-ui-fg-subtle">
                {data.legal_note_en}
              </Text>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-x-2 px-6 py-4">
            <Button
              variant="secondary"
              type="button"
              disabled={!isDirty || saveMutation.isPending}
              onClick={() => setGuardOpen(true)}
            >
              Reset
            </Button>
            <Button
              type="button"
              disabled={!isDirty || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  is_vat_enabled: enabled,
                  prices_include_vat: includeVat,
                })
              }
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </>
      )}

      <Prompt
        open={guardOpen}
        onOpenChange={setGuardOpen}
        variant="confirmation"
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Unsaved changes</Prompt.Title>
            <Prompt.Description>
              You have unsaved changes. Are you sure you want to exit? Your
              edits to the VAT display flags will be lost.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setGuardOpen(false)}>
              Keep editing
            </Prompt.Cancel>
            <Prompt.Action onClick={discardChanges}>
              Discard changes
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}
