import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ExclamationCircle, ShieldCheck } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Table,
  Text,
  Skeleton,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { bdClient } from "../../lib/bd-client"

type AuditLogEntry = {
  id: string
  seq: number
  occurred_at: string
  actor_id: string
  actor_email: string | null
  actor_type: string
  actor_role: string | null
  entity_type: string
  entity_label: string | null
  entity_id: string
  action: string
  changed_fields: string[] | null
  record_hash: string
}

type AuditLogsResponse = {
  logs: AuditLogEntry[]
  count: number
  limit: number
  offset: number
}

const PAGE_SIZE = 20

/**
 * Read-only audit trail viewer (architecture.md §15.1, FR-12.2/FR-12.8.7).
 * Access is enforced server-side by the /admin/audit-logs middleware —
 * only Owner and Finance roles reach this data (403 otherwise). The table
 * is append-only at the database level; this screen never mutates.
 */
export default function AuditLogsPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["bd", "audit-logs", 0],
    queryFn: () =>
      bdClient.fetch<AuditLogsResponse>(
        `/admin/audit-logs?limit=${PAGE_SIZE}&offset=0`
      ),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-x-2 px-6 py-4">
        <ShieldCheck />
        <Heading level="h2">Audit Logs</Heading>
        <Badge size="2xsmall" color="grey" className="ml-auto">
          Owner & Finance only
        </Badge>
      </div>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Immutable, hash-chained record of security, role, price and
          operational events. Entries are append-only and cannot be edited or
          deleted (database trigger enforced).
        </Text>
      </div>
      {isPending ? (
        <div className="flex flex-col gap-y-3 px-6 py-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-x-2 px-6 py-6">
          <ExclamationCircle className="text-ui-fg-error" />
          <Text size="small" className="text-ui-fg-error">
            {(error as Error).message}
          </Text>
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="flex flex-col items-center gap-y-2 px-6 py-12">
          <ShieldCheck className="text-ui-fg-subtle" />
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            No audit entries yet
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Security and operational events will appear here as staff act on
            orders, products, prices and settings.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell>Actor</Table.HeaderCell>
              <Table.HeaderCell>Entity</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
              <Table.HeaderCell>Changed fields</Table.HeaderCell>
              <Table.HeaderCell>Chain hash</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.logs.map((log) => (
              <Table.Row key={log.id}>
                <Table.Cell>
                  {new Date(log.occurred_at).toLocaleString("en-GB", {
                    timeZone: "Asia/Dhaka",
                  })}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span>{log.actor_email ?? log.actor_id}</span>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {log.actor_type}
                      {log.actor_role ? ` · ${log.actor_role}` : ""}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span>{log.entity_label ?? log.entity_id}</span>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {log.entity_type}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color="blue">
                    {log.action}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {log.changed_fields?.length
                      ? log.changed_fields.join(", ")
                      : "—"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                    {log.record_hash.slice(0, 12)}…
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Audit Logs",
  icon: ShieldCheck,
  rank: 32,
})
