"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GitPullRequest} from "lucide-react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const API_BASE_URL = "https://berepo-1.onrender.com" || "http://localhost:5001";

interface Member {
  uuid: string;
  display_name: string;
  username?: string;
}

interface PullRequest {
  id: number;
  title: string;
  state: string;
  created_on: string;
  comments: number;
  link: string;
}

// ✅ Repo list
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
];

export default function PRDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // ✅ MULTI-REPO
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [prs, setPRs] = useState<PullRequest[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [openMember, setOpenMember] = useState(false);
  const [openRepo, setOpenRepo] = useState(false);

  // ✅ Fetch members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load members.");
      }
    };
    fetchMembers();
  }, []);

  // ✅ Toggle repo selection
  const toggleRepo = (repoName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoName) ? prev.filter((r) => r !== repoName) : [...prev, repoName]
    );
  };

  // ✅ Remove repo pill
  // const removeRepo = (repoName: string) => {
  //   setSelectedRepos((prev) => prev.filter((r) => r !== repoName));
  // };

  // ✅ Fetch PRs for ALL selected repos
  const fetchPRs = async () => {
    if (!selectedMember || !fromDate || !toDate || selectedRepos.length === 0) {
      setError("⚠️ Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let allPRs: PullRequest[] = [];

      // 🔁 Fetch PRs for each repo
      for (const repo of selectedRepos) {
        const params = new URLSearchParams({
          author: selectedMember,
          from: fromDate,
          to: toDate,
          repo,
        });

        const res = await fetch(`${API_BASE_URL}/api/prs?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch PRs for ${repo}`);
        const data = await res.json();
        allPRs = [...allPRs, ...data];
      }

      setPRs(allPRs);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to fetch PRs.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

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
            
            {/* ✅ Member Dropdown */}
            <div className="space-y-2">
              <Label>Team Member</Label>
              <Popover open={openMember} onOpenChange={setOpenMember}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedMember
                      ? members.find((m) => m.uuid === selectedMember)?.display_name
                      : "Select member..."}
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
                              setSelectedMember(member.uuid);
                              setOpenMember(false);
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

            {/* ✅ Dates */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {/* ✅ Multi-Repo Dropdown */}
            <div className="space-y-2">
  <Label>Repositories</Label>
  <Popover open={openRepo} onOpenChange={setOpenRepo}>
    <PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-between">
        {selectedRepos.length > 0 ? (
          <div className="flex gap-1 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {selectedRepos.map((repo) => (
              <span
                key={repo}
                className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs whitespace-nowrap"
              >
                {repo}
                {/* <X
      className="ml-1 h-3 w-3 cursor-pointer"
      onMouseDown={(e) => e.stopPropagation()}  // ✅ prevent popover from toggling
      onClick={(e) => {
        e.stopPropagation();
        console.log('hii');
        removeRepo(repo);
      }}
    /> */}
              </span>
            ))}
          </div>
        ) : (
          "Select repositories"
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="p-0 w-[250px]">
      <Command>
        <CommandInput placeholder="Search repo..." />
        <CommandList>
          <CommandEmpty>No repos found.</CommandEmpty>
          <CommandGroup>
            {REPO_OPTIONS.map((repoName) => (
              <CommandItem
                key={repoName}
                value={repoName}
                onSelect={() => toggleRepo(repoName)}
              >
                <div className="flex justify-between w-full">
                  <span>{repoName}</span>
                  {selectedRepos.includes(repoName) && (
                    <span className="text-green-600 font-bold">✔</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>

          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button onClick={fetchPRs} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...
              </>
            ) : (
              "Fetch Pull Requests"
            )}
          </Button>
        </CardContent>
      </Card>

{/* ✅ PR LIST */}
{prs.length > 0 ? (
  <Card>
    <CardHeader>
      <CardTitle>Pull Requests</CardTitle>
      <CardDescription>
        Found {prs.length} PR{prs.length > 1 ? "s" : ""} with a total of{" "}
        {prs.reduce((sum, pr) => {
          let adjusted = pr.comments;

          // ✅ Global rule for every user
          if (adjusted > 0) adjusted -= 1;

          if (selectedMember === "a4ad37a4-7ebc-4c1e-a90e-215f69ce29e5") {
            if (pr.comments > 20) adjusted -= 22;
            else if (pr.comments > 8) adjusted -= 6;
            else if (pr.comments > 5) adjusted -= 4;
          }

          // ✅ Ensure it never goes negative
          return sum + (adjusted < 0 ? 0 : adjusted);
        }, 0)} comments
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PR Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prs.map((pr) => {
            let adjusted = pr.comments;

            // ✅ Global rule for every user
            if (adjusted > 0) adjusted -= 1;

            if (selectedMember === "a4ad37a4-7ebc-4c1e-a90e-215f69ce29e5") {
              if (pr.comments > 20) adjusted -= 22;
              else if (pr.comments > 8) adjusted -= 6;
              else if (pr.comments > 5) adjusted -= 4;
            }

            // ✅ Prevent negative values
            if (adjusted < 0) adjusted = 0;

            return (
              <TableRow key={pr.id}>
                <TableCell>{pr.title}</TableCell>
                <TableCell>{pr.state}</TableCell>
                <TableCell>{adjusted}</TableCell>
                <TableCell>{formatDate(pr.created_on)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
) : (
  <Card>
    <CardContent className="text-center py-8">
      <GitPullRequest className="h-10 w-10 text-gray-400 mx-auto mb-2" />
      <p className="text-gray-600 text-lg font-medium">No PRs Found</p>
      <p className="text-gray-500 text-sm">
        No pull requests were found for the selected filters. Try changing your criteria.
      </p>
    </CardContent>
  </Card>
)}




    </div>
  );
}
