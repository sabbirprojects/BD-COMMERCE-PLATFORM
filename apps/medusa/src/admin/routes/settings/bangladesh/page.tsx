import { ExclamationCircle, MapPin } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Prompt,
  Skeleton,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { bdClient } from "../../../lib/bd-client"

type ZoneRate = {
  id: string
  code: string
  name_en: string
  name_bn: string
  cod_enabled: boolean
  shipping_option_id: string | null
  price_id: string | null
  price_set_id: string | null
  amount: number | null
  currency_code: string | null
}

type BangladeshSettingsResponse = {
  zones: ZoneRate[]
}

type SaveRatesBody = {
  rates: { zone_id: string; amount: number }[]
}

/**
 * Bangladesh delivery configuration (architecture.md §15.1, technical-plan
 * §6.4). Zone display rates live in native `shipping_option` price sets in
 * BDT major units (agent.md money boundary) — this screen writes those
 * native prices only; the custom `delivery_zone` rows carry coverage/COD
 * policy and are never given duplicate fee columns.
 *
 * Implements CHK-ADM-04 on a custom form: loading Skeleton, empty state and
 * an unsaved-changes Prompt guard.
 */
export default function SettingsBangladeshPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["bd", "settings", "bangladesh"],
    queryFn: () =>
      bdClient.fetch<BangladeshSettingsResponse>("/admin/settings/bangladesh"),
  })

  const [rates, setRates] = useState<Record<string, string>>({})
  const [guardOpen, setGuardOpen] = useState(false)

  useEffect(() => {
    if (!data) return
    const next: Record<string, string> = {}
    for (const zone of data.zones) {
      next[zone.id] = zone.amount != null ? String(zone.amount) : ""
    }
    setRates(next)
  }, [data])

  const isDirty = useMemo(() => {
    if (!data) return false
    return data.zones.some((zone) => {
      const current = rates[zone.id] ?? ""
      const saved = zone.amount != null ? String(zone.amount) : ""
      return current !== saved
    })
  }, [data, rates])

  useEffect(() => {
    if (!isDirty) return
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [isDirty])

  const saveMutation = useMutation({
    mutationFn: (body: SaveRatesBody) =>
      bdClient.post("/admin/settings/bangladesh", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "settings", "bangladesh"] })
      toast.success("Delivery rates saved", {
        description: "Native shipping option prices updated.",
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to save rates", { description: err.message })
    },
  })

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    if (!data) return
    const payload: SaveRatesBody = {
      rates: data.zones
        .map((zone) => ({
          zone_id: zone.id,
          amount: Number(rates[zone.id]),
        }))
        .filter((r) => Number.isFinite(r.amount) && r.amount >= 0),
    }
    if (payload.rates.length !== data.zones.length) {
      toast.error("Invalid rates", {
        description: "Every zone needs a non-negative BDT rate.",
      })
      return
    }
    saveMutation.mutate(payload)
  }

  const discardChanges = () => {
    if (!data) return
    const next: Record<string, string> = {}
    for (const zone of data.zones) {
      next[zone.id] = zone.amount != null ? String(zone.amount) : ""
    }
    setRates(next)
    setGuardOpen(false)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-x-2 px-6 py-4">
        <MapPin />
        <Heading level="h2">Bangladesh</Heading>
        <Badge size="2xsmall" color="grey" className="ml-auto">
          Delivery zones
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
      ) : !data || data.zones.length === 0 ? (
        <div className="flex flex-col items-center gap-y-2 px-6 py-12">
          <MapPin className="text-ui-fg-subtle" />
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            No delivery zones configured
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Run the foundation seed (npm run seed:foundation) to create the
            Inside Dhaka, Dhaka Suburbs and Outside Dhaka zones.
          </Text>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-y-4 px-6 py-6">
            <Text size="small" className="text-ui-fg-subtle">
              Display rates are stored as native shipping option prices in BDT
              (৳ major units) and are admin-editable. They are placeholders
              until the owner confirms final pricing — checkout never hardcodes
              these values.
            </Text>
            {data.zones.map((zone) => (
              <div
                key={zone.id}
                className="grid grid-cols-1 items-center gap-x-4 gap-y-2 md:grid-cols-[1fr_auto_200px]"
              >
                <div className="flex flex-col">
                  <Text size="small" weight="plus">
                    {zone.name_en}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {zone.name_bn} · {zone.code}
                    {zone.cod_enabled ? " · COD available" : " · prepaid only"}
                  </Text>
                </div>
                <div className="flex items-center gap-x-2">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    COD
                  </Text>
                  <Switch checked={zone.cod_enabled} disabled={true} />
                </div>
                <div className="flex items-center gap-x-2">
                  <Text size="small" className="text-ui-fg-base">
                    ৳
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Rate in BDT"
                    value={rates[zone.id] ?? ""}
                    onChange={(e) =>
                      setRates((prev) => ({
                        ...prev,
                        [zone.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
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
            <Button type="submit" disabled={!isDirty || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save rates"}
            </Button>
          </div>
        </form>
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
              edits to the delivery rates will be lost.
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
