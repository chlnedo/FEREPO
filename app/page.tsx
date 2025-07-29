"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, GitPullRequest, FileDown } from "lucide-react"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { generatePDFReport } from "@/lib/pdf-generator"
import { ReportCharts } from "@/components/report-charts"

const API_BASE_URL = "https://berepo-1.onrender.com" 

interface Member {
  uuid: string
  display_name: string
  username?: string
}

interface PullRequest {
  id: number
  title: string
  state: string
  created_on: string
  merged_on?: string
  comments: number
  commits: number
  link: string
  target_branch?: string
  days_to_merge?: number
  merged_by?: string
}

const REPO_OPTIONS = [
  "bitdelta_web",
  "difx_exchange_rewamp",
  "ofza_web",
  "visiion_web",
  "doshx",
  "zenit",
  "webcore",
  "difx_web_reusable_libs",
  "delta_frontend_main",
  "delta_frontend_libs",
  "delta_frontend_derivative",
  "difx_web_wallet_app",
]

const STATE_OPTIONS = ["OPEN", "MERGED", "DECLINED"]

export default function PRDashboard() {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>("")
  const [targetBranch, setTargetBranch] = useState<string>("")
  const [prs, setPRs] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState<string>("")
  const [openMember, setOpenMember] = useState(false)
  const [openRepo, setOpenRepo] = useState(false)
  const [openState, setOpenState] = useState(false)
  const [showCharts, setShowCharts] = useState(false)

  const chartsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members`)
        if (!res.ok) throw new Error("Failed to fetch members")
        const data = await res.json()
        setMembers(data)
      } catch (err) {
        console.error(err)
        setError("❌ Failed to load members.")
      }
    }
    fetchMembers()
  }, [])

  const toggleRepo = (repoName: string) => {
    setSelectedRepos((prev) => (prev.includes(repoName) ? prev.filter((r) => r !== repoName) : [...prev, repoName]))
  }

  const fetchPRs = async () => {
    if (!selectedMember || !fromDate || !toDate || selectedRepos.length === 0) {
      setError("⚠️ Please fill all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      let allPRs: PullRequest[] = []
      for (const repo of selectedRepos) {
        const params = new URLSearchParams({
          author: selectedMember,
          from: fromDate,
          to: toDate,
          repo,
        })
        if (selectedState) params.append("state", selectedState)
        if (targetBranch) params.append("target_branch", targetBranch)

        const res = await fetch(`${API_BASE_URL}/api/prs?${params}`)
        if (!res.ok) throw new Error(`Failed to fetch PRs for ${repo}`)
        const data = await res.json()
        allPRs = [...allPRs, ...data]
      }
      setPRs(allPRs)
    } catch (err) {
      console.error(err)
      setError("❌ Failed to fetch PRs.")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!selectedMember || selectedRepos.length === 0) {
      setError("⚠️ Member & repo required for report")
      return
    }

    const repo = selectedRepos[0]
    const params = new URLSearchParams({
      author: selectedMember,
      repo,
    })
    if (fromDate) params.append("from", fromDate)
    if (toDate) params.append("to", toDate)
    if (selectedState) params.append("state", selectedState)
    if (targetBranch) params.append("target_branch", targetBranch)

    const url = `${API_BASE_URL}/api/prs/report?${params}`
    window.open(url, "_blank")
  }

  const generateEvaluationReport = async () => {
    if (prs.length === 0) {
      setError("⚠️ No PR data available for report generation")
      return
    }

    setGeneratingReport(true)
    try {
      const selectedMemberData = members.find((m) => m.uuid === selectedMember)
      const reportData = {
        employee: selectedMemberData?.display_name || "Unknown",
        dateRange: `${fromDate} to ${toDate}`,
        repositories: selectedRepos,
        prs,
        summary: {
          totalPRs: prs.length,
          totalComments: prs.reduce((sum, pr) => sum + (pr.comments || 0), 0),
          totalCommits: prs.reduce((sum, pr) => sum + (pr.commits || 0), 0),
          mergedPRs: prs.filter((pr) => pr.state === "MERGED").length,
          openPRs: prs.filter((pr) => pr.state === "OPEN").length,
          declinedPRs: prs.filter((pr) => pr.state === "DECLINED").length,
          avgDaysToMerge: calculateAvgDaysToMerge(prs),
        },
      }

      await generatePDFReport(reportData, chartsRef.current)
    } catch (err) {
      console.error(err)
      setError("❌ Failed to generate report")
    } finally {
      setGeneratingReport(false)
    }
  }

  const calculateAvgDaysToMerge = (prs: PullRequest[]) => {
    const mergedPRs = prs.filter((pr) => pr.state === "MERGED" && pr.days_to_merge !== undefined)
    if (mergedPRs.length === 0) return 0
    return mergedPRs.reduce((sum, pr) => sum + (pr.days_to_merge || 0), 0) / mergedPRs.length
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  // ✅ SUMMARY CALCULATIONS
  const totalPRs = prs.length
  const totalComments = prs.reduce((sum, pr) => sum + (pr.comments || 0), 0)
  const totalCommits = prs.reduce((sum, pr) => sum + (pr.commits || 0), 0)
  const mergedPRs = prs.filter((pr) => pr.state === "MERGED" && pr.days_to_merge !== undefined)
  const avgDaysToMerge =
    mergedPRs.length > 0
      ? (mergedPRs.reduce((sum, pr) => sum + (pr.days_to_merge || 0), 0) / mergedPRs.length).toFixed(1)
      : "—"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <GitPullRequest className="h-7 w-7 text-blue-600" /> Bitbucket PR Dashboard
      </h1>

      {/* FILTERS */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select filters and fetch PRs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Member */}
            <div className="space-y-2">
              <Label>Team Member <span className="text-red-500">*</span></Label>
              <Popover open={openMember} onOpenChange={setOpenMember}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                    {selectedMember ? members.find((m) => m.uuid === selectedMember)?.display_name : "Select member..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search member..." />
                    <CommandList>
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup>
                        {members.map((member) => (
                          <CommandItem
                            key={member.uuid}
                            value={`${member.display_name} ${member.username}`}
                            onSelect={() => {
                              setSelectedMember(member.uuid)
                              setOpenMember(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{member.display_name}</span>
                              <span className="text-xs text-gray-500">{member.username}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label>From Date <span className="text-red-500">*</span></Label>
              <Input required type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date <span className="text-red-500">*</span></Label>
              <Input required type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {/* Repo Dropdown */}
            <div className="space-y-2">
              <Label>Repositories <span className="text-red-500">*</span></Label>
              <Popover open={openRepo} onOpenChange={setOpenRepo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    {selectedRepos.length > 0 ? selectedRepos.join(", ") : "Select repositories"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]">
                  <Command>
                    <CommandInput placeholder="Search repo..." />
                    <CommandList>
                      <CommandEmpty>No repos found.</CommandEmpty>
                      <CommandGroup>
                        {REPO_OPTIONS.map((repoName) => (
                          <CommandItem key={repoName} value={repoName} onSelect={() => toggleRepo(repoName)}>
                            <div className="flex justify-between w-full">
                              <span>{repoName}</span>
                              {selectedRepos.includes(repoName) && <span className="text-green-600 font-bold">✔</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* State Filter */}
            <div className="space-y-2">
              <Label>PR State</Label>
              <Popover open={openState} onOpenChange={setOpenState}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    {selectedState || "All State Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {STATE_OPTIONS.map((state) => (
                          <CommandItem
                            key={state}
                            value={state}
                            onSelect={() => {
                              setSelectedState(state)
                              setOpenState(false)
                            }}
                          >
                            {state}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Target Branch Input */}
            <div className="space-y-2">
              <Label>Target Branch</Label>
              <Input
                placeholder="e.g. develop or main"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-4 lg:flex-row flex-col">
            <Button onClick={fetchPRs} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...
                </>
              ) : (
                "Fetch PRs"
              )}
            </Button>
            <Button onClick={downloadReport} variant="secondary">
              <FileDown className="mr-2 h-4 w-4" /> Download Report
            </Button>
            <Button
              onClick={generateEvaluationReport}
              variant="outline"
              disabled={generatingReport || prs.length === 0}
            >
              {generatingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" /> 📄 Generate Evaluation Report
                </>
              )}
            </Button>
            <Button
        onClick={() => setShowCharts((prev) => !prev)}
        disabled={generatingReport || prs.length === 0}
        variant="secondary"
      >
        {showCharts ? "Hide Charts" : "Show Charts"}
      </Button>

          </div>
        </CardContent>
      </Card>

      {/* Hidden Charts for PDF Generation */}
      {showCharts && (
  <div className="mt-6">
    <div className="flex flex-row gap-6 flex-wrap">
      <ReportCharts prs={prs} />
    </div>
  </div>
)}

{/* ✅ Hidden charts (always rendered for PDF) */}
<div ref={chartsRef} style={{ display: "none" }}>
  <ReportCharts prs={prs} />
</div>
      {/* ✅ Summary Section */}
      {prs.length > 0 && (
        <Card className="bg-gray-50 border rounded-lg p-4">
          <CardHeader>
            <CardTitle className="text-xl">📊 PR Summary</CardTitle>
            <CardDescription>Overview of fetched PR data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded shadow">
                <h3 className="text-lg font-semibold">Total PRs</h3>
                <p className="text-2xl text-blue-600">{totalPRs}</p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <h3 className="text-lg font-semibold">Total Comments</h3>
                <p className="text-2xl text-purple-600">{totalComments}</p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <h3 className="text-lg font-semibold">Total Commits</h3>
                <p className="text-2xl text-green-600">{totalCommits}</p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <h3 className="text-lg font-semibold">Avg Days to Merge</h3>
                <p className="text-2xl text-orange-600">{avgDaysToMerge}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ PR LIST */}
      {prs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
            <CardDescription>Showing {prs.length} PRs</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Title</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Commits</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Days to Merge</TableHead>
                  <TableHead>Merged By</TableHead>
                  <TableHead>Target Branch</TableHead>
                  <TableHead>PR Link</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell>{pr.title}</TableCell>
                    {/* ✅ Color-coded PR state */}
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pr.state === "MERGED"
                            ? "bg-green-100 text-green-700"
                            : pr.state === "DECLINED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pr.state}
                      </span>
                    </TableCell>
                    <TableCell>{pr.commits}</TableCell>
                    <TableCell>{pr.comments}</TableCell>
                    <TableCell>{pr.days_to_merge ?? "—"}</TableCell>
                    <TableCell>{pr.merged_by ?? "—"}</TableCell>
                    <TableCell>{pr.target_branch || "—"}</TableCell>
                    <TableCell>
                      <Link href={pr.link} target="_blank" className="text-blue-600 underline">
                        View PR
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(pr.created_on)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        !loading && <div className="text-center text-gray-500 mt-6 text-lg font-medium">🚫 No data available</div>
      )}
    </div>
  )
}
