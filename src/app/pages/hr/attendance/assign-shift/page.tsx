"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarConfig } from "@/components/sidebar-config"

type UserItem = { Full_name: string | null; emp_code: string | null }
type GroupMember = { Full_name: string; biomatric_id: number; shift_time: string }
type GroupItem = { group_name: string; members: GroupMember[] }

export default function Page() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [groupName, setGroupName] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [query, setQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/attendance/assign-shift", { cache: "no-store" })
        const data = await res.json()
        if (data?.success && Array.isArray(data.users)) {
          setUsers(data.users)
        }
        if (data?.success && Array.isArray(data.departments)) {
          setDepartments(data.departments)
        }
        if (data?.success && Array.isArray(data.groups)) {
          setGroups(data.groups)
        }
      } catch (e) {
        // noop
      }
    }
    load()
  }, [])

  const toggleUser = (fullName: string) => {
    setSelected((prev) =>
      prev.includes(fullName) ? prev.filter((n) => n !== fullName) : [...prev, fullName]
    )
  }

  const submit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!selected.length) {
      setError("Select at least one user")
      return false
    }
    if (!startTime || !endTime) {
      setError("Start and End time are required (HH:mm)")
      return false
    }
    setLoading(true)
    try {
      const res = await fetch("/api/attendance/assign-shift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedUsers: selected, start_time: startTime, end_time: endTime, groupName }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || "Failed to assign shift")
        return false
      } else {
        const updatedNames: string[] = Array.isArray(data?.updated_names) ? data.updated_names : []
        const insertedNames: string[] = Array.isArray(data?.inserted_names) ? data.inserted_names : []
        const skippedNames: string[] = Array.isArray(data?.skipped_names) ? data.skipped_names : []

        const parts: string[] = []
        if (insertedNames.length) parts.push(`Inserted: ${insertedNames.join(', ')}`)
        if (updatedNames.length) parts.push(`Updated: ${updatedNames.join(', ')}`)
        if (skippedNames.length) parts.push(`Skipped: ${skippedNames.join(', ')}`)

        setMessage(`Assigned ${data.shift_time}. ${parts.join(' | ')}`)
        return true
      }
    } catch (e: any) {
      setError(e?.message || "Error")
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <SidebarConfig role="hr" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Allocate Shift</h1>
        <Button type="button" onClick={() => setShowModal(true)}>Allocate Shift</Button>
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      {message ? <div className="text-green-600 text-sm">{message}</div> : null}

      {/* Allocated groups list */}
      <Card>
        <CardHeader>
          <CardTitle>Group Name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {groups.length === 0 ? (
            <div className="text-xl text-muted-foreground">Fetching....</div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {groups.map((g) => (
                <AccordionItem key={g.group_name} value={g.group_name}>
                  <AccordionTrigger className="px-3 py-2">
                    <div className="w-full flex items-center justify-between">
                      <span>+{g.group_name}</span>
                      <span className="text-md text-muted-foreground">{g.members.length} member(s)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 ml-1 space-y-1 pb-3 pr-3">
                      {g.members.map((m, i) => (
                        <div key={i} className="text-md flex items-center gap-2">
                          <span>{m.Full_name}</span>
                          <span className="text-muted-foreground">({m.biomatric_id})</span>
                          <span className="text-muted-foreground">— {m.shift_time}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Allocate Shift</h2>
              <Button variant="ghost" onClick={() => setShowModal(false)}>✕</Button>
            </div>

            <form onSubmit={async (e) => {
              const ok = await submit(e)
              // Refresh groups regardless
              try {
                const r = await fetch('/api/attendance/assign-shift', { cache: 'no-store' })
                const d = await r.json()
                if (d?.success && Array.isArray(d.groups)) setGroups(d.groups)
              } catch {}
              if (ok) {
                // Reset form and close modal on success
                setSelected([])
                setQuery("")
                setStartTime("")
                setEndTime("")
                setGroupName("")
                setShowModal(false)
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 block">Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div>
                  <Label className="mb-1 block">End Time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
                <div>
                  <Label className="mb-1 block">Group Name</Label>
                  <Select value={groupName} onValueChange={setGroupName}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Group Name" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d, i) => (
                        <SelectItem key={i} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Select Users</Label>
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    placeholder="Search by name or employee id..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {query ? (
                  <div className="mb-3 border rounded p-2 bg-white max-h-48 overflow-auto">
                    {users
                      .filter((u) => {
                        const name = (u.Full_name || "").toLowerCase()
                        const emp = (u.emp_code || "").toLowerCase()
                        const q = query.toLowerCase().trim()
                        if (!q) return false
                        // exclude already selected
                        if (u.Full_name && selected.includes(u.Full_name)) return false
                        return name.includes(q) || emp.includes(q)
                      })
                      .slice(0, 20)
                      .map((u, i) => {
                        const full = u.Full_name || ""
                        if (!full) return null
                        return (
                          <Button
                            key={i}
                            type="button"
                            variant="ghost"
                            className="w-full justify-between px-2 py-1 h-auto"
                            onClick={() => { toggleUser(full); setQuery("") }}
                          >
                            <span>{full}</span>
                            {u.emp_code ? <span className="text-muted-foreground text-xs">{u.emp_code}</span> : null}
                          </Button>
                        )
                      })}
                    {users.filter((u) => {
                      const name = (u.Full_name || "").toLowerCase()
                      const emp = (u.emp_code || "").toLowerCase()
                      const q = query.toLowerCase().trim()
                      if (!q) return false
                      if (u.Full_name && selected.includes(u.Full_name)) return false
                      return name.includes(q) || emp.includes(q)
                    }).length === 0 && (
                      <div className="text-sm text-gray-500">No matches</div>
                    )}
                  </div>
                ) : null}

                {selected.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selected.map((name) => (
                      <span key={name} className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                        {name}
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2" onClick={() => toggleUser(name)}>×</Button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Assigning..." : "Assign Shift"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}