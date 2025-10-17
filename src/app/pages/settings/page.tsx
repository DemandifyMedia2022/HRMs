"use client"

import React, { useState } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [theme, setTheme] = useState("system")
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush] = useState(false)

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    // stub: integrate with API later
    console.log({ name, email, theme, notifEmail, notifPush })
  }

  return (
    <div>
      <SidebarConfig role="user" />
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your account, preferences, and notifications.</p>
        </div>

        <form onSubmit={onSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            {/* <CardContent className="grid gap-4 sm:max-w-sm">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent> */}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:max-w-sm">
              <label className="flex items-center gap-3">
                <Checkbox checked={notifEmail} onCheckedChange={(v) => setNotifEmail(Boolean(v))} />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <Checkbox checked={notifPush} onCheckedChange={(v) => setNotifPush(Boolean(v))} />
                <span className="text-sm">Push notifications</span>
              </label>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto">Save changes</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}

