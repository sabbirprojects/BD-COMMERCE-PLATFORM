import { defineRouteConfig } from "@medusajs/admin-sdk"
import { UserGroup, ShieldCheck, LockClosedSolid, ExclamationCircle, CheckCircle } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Select, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"

interface StaffUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  name: string
  role: string
  role_description?: string
  is_locked: boolean
  must_change_password: boolean
  created_at: string
}

const ROLES = [
  { value: "owner", label: "Owner (Super Admin — Full Unrestricted Access)" },
  { value: "manager", label: "Store Manager (Catalog, Orders, Courier)" },
  { value: "finance", label: "Finance & Accounts (COGS, Margins, Refunds)" },
  { value: "warehouse", label: "Warehouse & Dispatch (Fulfillment, Packing)" },
  { value: "call_center", label: "Call Center Staff (COD Verification Only)" },
  { value: "content", label: "Content Editor (Catalog & Landing Pages)" },
  { value: "staff", label: "Staff (Read-Only General Access)" },
]

export default function SettingsTeamPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteRole, setInviteRole] = useState("call_center")
  const [invitePassword, setInvitePassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function fetchTeam() {
    try {
      setLoading(true)
      const res = await fetch("/admin/team", {
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to load staff accounts")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/admin/team/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "Failed to update role")
      }
      toast.success("Role Updated", {
        description: `Staff role updated to ${newRole}. Existing sessions were invalidated immediately (AC-8.4).`,
      })
      fetchTeam()
    } catch (err: any) {
      toast.error("Role Update Failed", { description: err.message })
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail || !invitePassword) {
      toast.error("Validation Error", { description: "Email and password are required" })
      return
    }

    try {
      setSaving(true)
      const res = await fetch("/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          first_name: inviteFirstName,
          last_name: inviteLastName,
          role: inviteRole,
          password: invitePassword,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || errData.message || "Failed to invite staff")
      }

      toast.success("Staff Account Created", {
        description: `${inviteEmail} provisioned with role "${inviteRole}". Password change is required on first login (FR-8.2.5).`,
      })
      setShowInviteModal(false)
      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
      setInvitePassword("")
      fetchTeam()
    } catch (err: any) {
      toast.error("Failed to Provision Staff", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "owner":
        return "purple"
      case "manager":
        return "blue"
      case "finance":
        return "green"
      case "call_center":
        return "orange"
      case "warehouse":
        return "orange"
      default:
        return "grey"
    }
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold flex items-center gap-x-2">
            <UserGroup className="text-ui-fg-subtle" />
            Team & Role-Based Access Control (RBAC)
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage staff accounts, assign 7 canonical roles, enforce 5-attempt brute-force lockouts, and require initial password changes.
          </Text>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          Invite Staff Member
        </Button>
      </div>

      {/* Security Policies Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Container className="p-4 border-l-4 border-l-blue-500 flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2 text-blue-700 font-semibold text-sm">
            <LockClosedSolid className="w-4 h-4" />
            <span>Brute-Force Lockout Defense</span>
          </div>
          <Text className="text-xs text-ui-fg-subtle">
            5 consecutive failed logins automatically locks the account for 15 minutes in Redis across all IPs (FR-8.2.7, CHK-SEC-02).
          </Text>
        </Container>

        <Container className="p-4 border-l-4 border-l-orange-500 flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2 text-orange-700 font-semibold text-sm">
            <ExclamationCircle className="w-4 h-4" />
            <span>Forced First-Login Password Change</span>
          </div>
          <Text className="text-xs text-ui-fg-subtle">
            Staff provisioned with temporary passwords are blocked from all administrative APIs until changing password (FR-8.2.5).
          </Text>
        </Container>

        <Container className="p-4 border-l-4 border-l-purple-500 flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2 text-purple-700 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Session Revocation</span>
          </div>
          <Text className="text-xs text-ui-fg-subtle">
            Modifying a staff member's role or password immediately invalidates all active sessions in Redis (FR-8.2.6, AC-8.4).
          </Text>
        </Container>
      </div>

      {/* Staff Table */}
      <Container className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between bg-ui-bg-subtle">
          <Heading level="h2" className="text-base font-semibold">
            Staff Accounts ({users.length})
          </Heading>
          <Button size="small" variant="secondary" onClick={fetchTeam} isLoading={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-ui-fg-subtle">Loading team members...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-ui-fg-subtle">No staff members found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-ui-bg-subtle border-b border-ui-border-base text-xs uppercase text-ui-fg-muted font-medium">
              <tr>
                <th className="py-3 px-6">Staff Member</th>
                <th className="py-3 px-6">Current Role</th>
                <th className="py-3 px-6">Security Status</th>
                <th className="py-3 px-6">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border-base">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-ui-bg-subtle/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-ui-fg-base">{user.name}</div>
                    <div className="text-xs text-ui-fg-subtle">{user.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge color={getRoleBadgeColor(user.role) as any} size="small" className="uppercase font-semibold">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-y-1">
                      {user.is_locked ? (
                        <span className="text-xs text-rose-600 font-medium flex items-center gap-x-1">
                          <ExclamationCircle className="w-3.5 h-3.5" />
                          Account Locked (15m)
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Account Active
                        </span>
                      )}
                      {user.must_change_password && (
                        <span className="text-xs text-amber-600 font-medium">
                          Password change required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Select
                      size="small"
                      value={user.role}
                      onValueChange={(val) => handleRoleChange(user.id, val)}
                    >
                      <Select.Trigger className="w-48">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {ROLES.map((r) => (
                          <Select.Item key={r.value} value={r.value}>
                            {r.value}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Container>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Container className="max-w-md w-full p-6 bg-ui-bg-base shadow-xl rounded-lg">
            <Heading level="h2" className="text-lg font-bold mb-1">
              Invite Staff Member
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mb-4">
              Provision a new staff account. An initial password is set and password change is enforced on first login (FR-8.2.5). Passwords are never revealed post-creation.
            </Text>

            <form onSubmit={handleInvite} className="flex flex-col gap-y-4">
              <div>
                <label className="text-xs font-semibold text-ui-fg-muted mb-1 block">
                  Email Address *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="staff@bd-commerce.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-ui-fg-muted mb-1 block">
                    First Name
                  </label>
                  <Input
                    placeholder="Tanvir"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ui-fg-muted mb-1 block">
                    Last Name
                  </label>
                  <Input
                    placeholder="Hossain"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ui-fg-muted mb-1 block">
                  Assigned RBAC Role *
                </label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {ROLES.map((r) => (
                      <Select.Item key={r.value} value={r.value}>
                        {r.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ui-fg-muted mb-1 block">
                  Initial Temporary Password * (min 8 chars)
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-x-2 pt-4 border-t border-ui-border-base mt-2">
                <Button variant="secondary" onClick={() => setShowInviteModal(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={saving}>
                  Create Staff Account
                </Button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Team",
  icon: UserGroup,
})
