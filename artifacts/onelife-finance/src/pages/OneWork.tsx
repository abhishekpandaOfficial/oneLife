import React, { useEffect, useMemo, useState } from "react";
import {
  getGetDashboardSummaryQueryKey,
  getGetOneworkSummaryQueryKey,
  type OneworkProfile,
  type WorkCompany,
  type WorkDocument,
  type WorkDocumentCategory,
  type WorkDocumentFolder,
  type WorkDocumentType,
  type WorkPfEntry,
  type WorkPfSource,
  type WorkPfWithdrawal,
  useCreateWorkCompany,
  useCreateWorkDocument,
  useCreateWorkDocumentCategory,
  useCreateWorkPfEntry,
  useCreateWorkPfWithdrawal,
  useDeleteWorkCompany,
  useDeleteWorkDocument,
  useDeleteWorkDocumentCategory,
  useDeleteWorkPfEntry,
  useDeleteWorkPfWithdrawal,
  useGetOneworkSummary,
  useUpdateOneworkProfile,
  useUpdateWorkCompany,
  useUpdateWorkDocument,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleAlert,
  Clock3,
  BrainCircuit,
  FileCheck2,
  FilePlus2,
  FileSignature,
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Landmark,
  LockKeyhole,
  Pencil,
  Plus,
  ReceiptText,
  Share2,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/components/ui/animated-number";
import { useToast } from "@/hooks/use-toast";

type DialogMode = "company" | "document" | "folder" | "category" | "pf" | "withdrawal" | "profile" | "history" | null;
type SearchResult = {
  kind: string;
  title: string;
  subtitle: string;
  companyId: number | null;
  folderId?: number | null;
};
type DeleteTarget =
  | { type: "company"; id: number; name: string }
  | { type: "document"; id: number; name: string }
  | { type: "folder"; id: number; name: string }
  | { type: "category"; id: number; name: string }
  | { type: "pf"; id: number; name: string }
  | { type: "withdrawal"; id: number; name: string }
  | null;

const iconMap: Record<string, React.ElementType> = {
  BadgeIndianRupee,
  Building2,
  FileCheck2,
  FileSignature,
  FileText,
  Folder,
  Landmark,
  ReceiptText,
  ScrollText,
  TrendingDown,
  TrendingUp,
};

const companyIcons = ["Building2", "BriefcaseBusiness", "Landmark", "BadgeIndianRupee", "TrendingUp"];
const folderIcons = ["Folder", "FileText", "ReceiptText", "FileSignature", "FileCheck2", "ScrollText", "Landmark"];

const docTypes: Array<{ value: WorkDocumentType; label: string }> = [
  { value: "payslip", label: "Payslip" },
  { value: "joining_letter", label: "Joining letter" },
  { value: "hike_letter", label: "Hike letter" },
  { value: "relieving_letter", label: "Relieving letter" },
  { value: "form16", label: "Form 16" },
  { value: "pf_statement", label: "PF statement" },
  { value: "other", label: "Other" },
];

const employmentTypes = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
] as const;

function invalidateOneWork(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: getGetOneworkSummaryQueryKey() });
  queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
}

function monthInput(date = new Date()) {
  return format(date, "yyyy-MM");
}

function todayInput() {
  return format(new Date(), "yyyy-MM-dd");
}

function displayDate(value: string | null | undefined, fallback = "Present") {
  if (!value) return fallback;
  return format(parseISO(value), "MMM yyyy");
}

function experienceLabel(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

function annualize(monthly: number) {
  return monthly * 12;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.message || body?.error || "Request failed");
  return body as T;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function OneWork() {
  const { data: summary, isLoading, isError } = useGetOneworkSummary();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [pendingFolderId, setPendingFolderId] = useState<number | null>(null);
  const [editingCompany, setEditingCompany] = useState<WorkCompany | null>(null);
  const [editingDocument, setEditingDocument] = useState<WorkDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const mutationHandlers = (successTitle: string, closeDialog = true) => ({
    onSuccess: () => {
      toast({ title: successTitle });
      invalidateOneWork(queryClient);
      if (closeDialog) setDialog(null);
      setEditingCompany(null);
      setEditingDocument(null);
      setPendingFolderId(null);
      setDeleteTarget(null);
    },
    onError: (error: unknown) => toast({ title: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" as const }),
  });

  const createCompany = useCreateWorkCompany({ mutation: mutationHandlers("Company added") });
  const updateCompany = useUpdateWorkCompany({ mutation: mutationHandlers("Company updated") });
  const deleteCompany = useDeleteWorkCompany({ mutation: mutationHandlers("Company removed", false) });
  const createDocument = useCreateWorkDocument({ mutation: mutationHandlers("File uploaded") });
  const updateDocument = useUpdateWorkDocument({ mutation: mutationHandlers("File updated") });
  const deleteDocument = useDeleteWorkDocument({ mutation: mutationHandlers("File deleted", false) });
  const createCategory = useCreateWorkDocumentCategory({ mutation: mutationHandlers("Category added") });
  const deleteCategory = useDeleteWorkDocumentCategory({ mutation: mutationHandlers("Category deleted", false) });
  const createPfEntry = useCreateWorkPfEntry({ mutation: mutationHandlers("PF entry added") });
  const deletePfEntry = useDeleteWorkPfEntry({ mutation: mutationHandlers("PF entry deleted", false) });
  const createWithdrawal = useCreateWorkPfWithdrawal({ mutation: mutationHandlers("PF withdrawal recorded") });
  const deleteWithdrawal = useDeleteWorkPfWithdrawal({ mutation: mutationHandlers("PF withdrawal deleted", false) });
  const updateProfile = useUpdateOneworkProfile({ mutation: mutationHandlers("UAN details saved") });

  const createFolder = useMutation({
    mutationFn: (data: any) => apiRequest<WorkDocumentFolder>("/api/onework/folders", { method: "POST", body: JSON.stringify(data) }),
    ...mutationHandlers("Folder created"),
  });
  const deleteFolder = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/api/onework/folders/${id}`, { method: "DELETE" }),
    ...mutationHandlers("Folder deleted", false),
  });
  const fetchHistory = useMutation({
    mutationFn: (data: { userId: string; password: string }) => apiRequest<{ status: string; message: string; importedCompanies: number }>("/api/onework/history/fetch", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (result) => {
      toast({ title: result.status === "connector_required" ? "Connector required" : "History fetched", description: result.message });
      invalidateOneWork(queryClient);
      setDialog(null);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "Could not fetch history", variant: "destructive" }),
  });

  const companies = useMemo(
    () => [...(summary?.companies ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [summary?.companies],
  );

  useEffect(() => {
    if (!selectedCompanyId && companies[0]) setSelectedCompanyId(companies[0].id);
  }, [companies, selectedCompanyId]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[560px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-8">
          <h1 className="text-xl font-semibold">OneWork could not load</h1>
          <p className="mt-2 text-muted-foreground">Please check the API server and try again.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;
  const companyFolders = selectedCompany ? summary.folders.filter((folder) => folder.companyId === selectedCompany.id) : [];
  const companyDocuments = selectedCompany ? summary.documents.filter((doc) => doc.companyId === selectedCompany.id) : [];
  const selectedFolder = companyFolders.find((folder) => folder.id === selectedFolderId) ?? null;
  const selectedFolderDocuments = selectedFolder ? companyDocuments.filter((doc) => doc.folderId === selectedFolder.id) : companyDocuments.filter((doc) => !doc.folderId);
  const activeCompany = companies.find((company) => !company.endDate);
  const latestPfEntries = [...summary.pfEntries].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);
  const latestWithdrawals = [...summary.pfWithdrawals].sort((a, b) => b.withdrawalDate.localeCompare(a.withdrawalDate)).slice(0, 5);
  const currentCompany = activeCompany ?? companies[0] ?? null;
  const highestMonthlySalary = companies.reduce((max, company) => Math.max(max, company.salaryMonthly), 0);
  const salaryTimeline = [...companies].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const hikePercentages = salaryTimeline
    .map((company, index) => {
      const previous = salaryTimeline[index - 1];
      if (!previous || previous.salaryMonthly <= 0) return null;
      return ((company.salaryMonthly - previous.salaryMonthly) / previous.salaryMonthly) * 100;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const averageAnnualHike = hikePercentages.length ? hikePercentages.reduce((sum, value) => sum + value, 0) / hikePercentages.length : 0;
  const recentUploads = [...summary.documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const documentNames = summary.documents.map((doc) => `${doc.name} ${doc.documentType} ${doc.categoryName ?? ""}`.toLowerCase());
  const requiredDocuments = ["offer", "joining", "payslip", "form 16", "pf"];
  const missingDocuments = requiredDocuments.filter((required) => !documentNames.some((name) => name.includes(required)));
  const careerScore = Math.min(100, Math.round(
    (companies.length ? 24 : 0) +
    (summary.documents.length ? 24 : 0) +
    (summary.profile?.uanNumber ? 16 : 0) +
    (summary.pfEntries.length ? 16 : 0) +
    (missingDocuments.length === 0 ? 20 : Math.max(0, 20 - missingDocuments.length * 4)),
  ));
  const aiInsights = [
    currentCompany ? `${currentCompany.companyName} is your current career anchor.` : "Add your current company to unlock career insights.",
    missingDocuments.length ? `${missingDocuments.length} important document types need attention.` : "Core employment documents look well covered.",
    summary.profile?.uanNumber ? "UAN profile is ready for future EPFO connector sync." : "Save UAN details to prepare PF automation.",
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchResults: SearchResult[] = normalizedSearch
    ? [
        ...summary.companies
          .filter((company) => [company.companyName, company.position, company.location, company.notes].some((value) => value?.toLowerCase().includes(normalizedSearch)))
          .map((company) => ({ kind: "Company", title: company.companyName, subtitle: company.position, companyId: company.id })),
        ...summary.folders
          .filter((folder) => [folder.name, folder.companyName, folder.notes].some((value) => value?.toLowerCase().includes(normalizedSearch)))
          .map((folder) => ({ kind: "Folder", title: folder.name, subtitle: folder.companyName || "Company folder", companyId: folder.companyId, folderId: folder.id })),
        ...summary.documents
          .filter((doc) => [doc.name, doc.fileName, doc.companyName, doc.folderName, doc.categoryName, doc.notes].some((value) => value?.toLowerCase().includes(normalizedSearch)))
          .map((doc) => ({ kind: "File", title: doc.name, subtitle: `${doc.companyName || "General"} / ${doc.folderName || "Unfiled"} / ${doc.fileName}`, companyId: doc.companyId, folderId: doc.folderId })),
      ]
    : [];

  const openCompanyDialog = (company?: WorkCompany) => {
    setEditingCompany(company ?? null);
    setDialog("company");
  };

  const openDocumentDialog = (document?: WorkDocument, folderId?: number | null) => {
    setEditingDocument(document ?? null);
    setPendingFolderId(folderId ?? document?.folderId ?? selectedFolderId ?? null);
    setDialog("document");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "company") deleteCompany.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "document") deleteDocument.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "folder") deleteFolder.mutate(deleteTarget.id);
    if (deleteTarget.type === "category") deleteCategory.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "pf") deletePfEntry.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "withdrawal") deleteWithdrawal.mutate({ id: deleteTarget.id });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <section className="overflow-hidden rounded-2xl border border-blue-500/15 bg-gradient-to-br from-card via-card to-blue-500/5">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_380px] lg:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-background">CareerOS</Badge>
              {activeCompany && <Badge>{activeCompany.companyName}</Badge>}
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> AI-ready</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">OneWork CareerOS Dashboard</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Lifetime career command center for companies, documents, PF/UAN, salary signals, milestones, and future AI document intelligence.
            </p>
            <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search OneWork companies, folders, files, notes..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openCompanyDialog()}><Plus className="mr-2 h-4 w-4" /> Company</Button>
                <Button variant="outline" onClick={() => setDialog("history")}><LockKeyhole className="mr-2 h-4 w-4" /> Fetch</Button>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Career score</p>
                <p className="mt-2 font-mono text-4xl font-bold">{careerScore}</p>
                <p className="mt-1 text-xs text-muted-foreground">Based on timeline, documents, PF, and readiness.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs font-medium uppercase text-muted-foreground">EPFO readiness</p>
            <p className="mt-2 text-sm">{summary.epfoSyncStatus}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setDialog("profile")}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Manage UAN
            </Button>
          </div>
        </div>
      </section>

      {normalizedSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Global Search</CardTitle>
            <CardDescription>{searchResults.length} results across companies, folders, and files.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching OneWork records.</p>
            ) : (
              searchResults.slice(0, 12).map((result, index) => (
                <button
                  key={`${result.kind}-${result.title}-${index}`}
                  type="button"
                  className="rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/30"
                  onClick={() => {
                    if (result.companyId) setSelectedCompanyId(result.companyId);
                    setSelectedFolderId(result.folderId ?? null);
                  }}
                >
                  <Badge variant="outline">{result.kind}</Badge>
                  <p className="mt-2 truncate font-medium">{result.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Current Company" value={currentCompany?.companyName ?? "Not set"} icon={Building2} tone="text-blue-600" />
        <MetricCard title="Current Designation" value={currentCompany?.position ?? "Not set"} icon={BriefcaseBusiness} tone="text-cyan-600" />
        <MetricCard title="Total Experience" value={experienceLabel(summary.totalExperienceMonths)} icon={Clock3} tone="text-violet-600" />
        <MetricCard title="Current CTC" value={formatCurrency(annualize(currentCompany?.salaryMonthly ?? 0))} icon={BadgeIndianRupee} tone="text-emerald-600" />
        <MetricCard title="Highest CTC" value={formatCurrency(annualize(highestMonthlySalary))} icon={TrendingUp} tone="text-lime-600" />
        <MetricCard title="Companies Worked" value={String(summary.totalCompanies)} icon={Building2} tone="text-blue-600" />
        <MetricCard title="Total Documents" value={String(summary.documents.length)} icon={FileText} tone="text-amber-600" />
        <MetricCard title="PF Balance" value={formatCurrency(summary.pfBalance)} icon={Landmark} tone="text-emerald-600" />
        <MetricCard title="Total Bonus Earned" value={formatCurrency(0)} icon={Award} tone="text-orange-600" />
        <MetricCard title="Average Hike" value={formatPercent(averageAnnualHike)} icon={BarChart3} tone="text-pink-600" />
        <MetricCard title="Current Duration" value={currentCompany?.tenureLabel ?? "0 mo"} icon={CalendarDays} tone="text-indigo-600" />
        <MetricCard title="Pending Documents" value={String(missingDocuments.length)} icon={CircleAlert} tone="text-red-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> AI Insights</CardTitle>
            <CardDescription>Assistant-ready career signals generated from live OneWork data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{insight}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Latest employment records entering the vault.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUploads.length === 0 ? (
              <EmptyState icon={Upload} title="No uploads yet" description="Upload payslips, letters, Form 16, PF statements, and certificates." />
            ) : (
              recentUploads.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{doc.companyName || "Global"} · {doc.categoryName || doc.documentType}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ReadinessCard icon={FileCheck2} title="Document Intelligence" status="Ready for OCR/AI" detail={`${summary.documentCategories.length} categories mapped`} />
        <ReadinessCard icon={Share2} title="Secure Sharing" status="Planned" detail="Share links, audit trail, and export packages" />
        <ReadinessCard icon={BarChart3} title="Career Analytics" status="Live baseline" detail="Experience, CTC, PF, documents, and timeline" />
        <ReadinessCard icon={WalletCards} title="Salary History" status="Planned storage" detail="CTC, bonus, hikes, ESOP, reimbursements" />
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[520px]">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="pf">PF Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
            <CompanyList
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={(id) => {
                setSelectedCompanyId(id);
                setSelectedFolderId(null);
              }}
              onAdd={() => openCompanyDialog()}
              onEdit={openCompanyDialog}
              onDelete={(company) => setDeleteTarget({ type: "company", id: company.id, name: company.companyName })}
            />
            <DocumentWorkspace
              company={selectedCompany}
              folders={companyFolders}
              documents={companyDocuments}
              selectedFolderId={selectedFolderId}
              selectedDocuments={selectedFolderDocuments}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={() => setDialog("folder")}
              onUploadFile={(folderId) => openDocumentDialog(undefined, folderId)}
              onEditFile={(doc) => openDocumentDialog(doc, doc.folderId)}
              onDeleteFile={(doc) => setDeleteTarget({ type: "document", id: doc.id, name: doc.name })}
              onDeleteFolder={(folder) => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Career Timeline</CardTitle>
                  <CardDescription>Company-wise role, salary, PF estimate, folders, files, and tenure.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openCompanyDialog()}><Plus className="mr-2 h-4 w-4" /> Company</Button>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <EmptyState icon={BriefcaseBusiness} title="No work history yet" description="Add or import your first company to start the timeline." />
                ) : (
                  <div className="relative space-y-4 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                    {companies.map((company) => (
                      <CompanyTimelineItem
                        key={company.id}
                        company={company}
                        selected={selectedCompanyId === company.id}
                        onSelect={() => setSelectedCompanyId(company.id)}
                        onEdit={() => openCompanyDialog(company)}
                        onDelete={() => setDeleteTarget({ type: "company", id: company.id, name: company.companyName })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <CompanyDetail
              company={selectedCompany}
              folders={companyFolders}
              documents={companyDocuments}
              onAddFolder={() => setDialog("folder")}
              onAddDocument={() => openDocumentDialog(undefined, null)}
              onEditCompany={() => selectedCompany && openCompanyDialog(selectedCompany)}
            />
          </div>
        </TabsContent>

        <TabsContent value="pf" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>PF Contributions</CardTitle>
                  <CardDescription>Manual monthly records plus company-based estimates.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setDialog("pf")}><Plus className="mr-2 h-4 w-4" /> PF Month</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Contributions" value={formatCurrency(summary.pfContributions)} />
                  <MiniStat label="Withdrawals" value={formatCurrency(summary.pfWithdrawalsTotal)} />
                  <MiniStat label="Balance" value={formatCurrency(summary.pfBalance)} />
                </div>
                <Separator />
                {latestPfEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No manual PF entries yet. Company PF estimates are still included in the balance.</p>
                ) : (
                  latestPfEntries.map((entry) => <PfEntryRow key={entry.id} entry={entry} onDelete={() => setDeleteTarget({ type: "pf", id: entry.id, name: entry.month })} />)
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Withdrawals</CardTitle>
                  <CardDescription>Track partial or full PF withdrawals against career records.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDialog("withdrawal")}><TrendingDown className="mr-2 h-4 w-4" /> Record</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestWithdrawals.length === 0 ? (
                  <EmptyState icon={TrendingDown} title="No withdrawals" description="Record withdrawals to keep PF balance accurate." />
                ) : (
                  latestWithdrawals.map((withdrawal) => <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} onDelete={() => setDeleteTarget({ type: "withdrawal", id: withdrawal.id, name: formatCurrency(withdrawal.amount) })} />)
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CompanyDialog company={editingCompany} open={dialog === "company"} onOpenChange={(open) => { setDialog(open ? "company" : null); if (!open) setEditingCompany(null); }} onSubmit={(data) => editingCompany ? updateCompany.mutate({ id: editingCompany.id, data }) : createCompany.mutate({ data })} />
      <FolderDialog open={dialog === "folder"} company={selectedCompany} onOpenChange={(open) => setDialog(open ? "folder" : null)} onSubmit={(data) => createFolder.mutate(data)} />
      <CategoryDialog open={dialog === "category"} onOpenChange={(open) => setDialog(open ? "category" : null)} onSubmit={(data) => createCategory.mutate({ data })} />
      <DocumentDialog
        document={editingDocument}
        companies={summary.companies}
        folders={selectedCompany ? summary.folders.filter((folder) => folder.companyId === selectedCompany.id) : summary.folders}
        categories={summary.documentCategories}
        defaultCompanyId={selectedCompany?.id ?? null}
        defaultFolderId={pendingFolderId}
        open={dialog === "document"}
        onOpenChange={(open) => { setDialog(open ? "document" : null); if (!open) { setEditingDocument(null); setPendingFolderId(null); } }}
        onSubmit={(data) => editingDocument ? updateDocument.mutate({ id: editingDocument.id, data }) : createDocument.mutate({ data })}
      />
      <PfEntryDialog companies={summary.companies} defaultCompanyId={selectedCompany?.id ?? null} open={dialog === "pf"} onOpenChange={(open) => setDialog(open ? "pf" : null)} onSubmit={(data) => createPfEntry.mutate({ data })} />
      <WithdrawalDialog companies={summary.companies} defaultCompanyId={selectedCompany?.id ?? null} open={dialog === "withdrawal"} onOpenChange={(open) => setDialog(open ? "withdrawal" : null)} onSubmit={(data) => createWithdrawal.mutate({ data })} />
      <ProfileDialog profile={summary.profile} open={dialog === "profile"} onOpenChange={(open) => setDialog(open ? "profile" : null)} onSubmit={(data) => updateProfile.mutate({ data })} />
      <HistoryFetchDialog open={dialog === "history"} isPending={fetchHistory.isPending} onOpenChange={(open) => setDialog(open ? "history" : null)} onSubmit={(data) => fetchHistory.mutate(data)} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting a company also removes its folders and files. Deleting a folder keeps files unfiled for that company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate font-mono text-2xl font-bold">{value}</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${tone}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessCard({ icon: Icon, title, status, detail }: { icon: React.ElementType; title: string; status: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            <p className="mt-1 text-sm font-medium text-primary">{status}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{value}</p></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/45" /><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function CompanyLogo({ company, size = "md" }: { company: WorkCompany; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const Icon = iconMap[company.icon] || Building2;
  if (company.logoUrl) {
    return <img src={company.logoUrl} alt={`${company.companyName} logo`} className={`${sizeClass} shrink-0 rounded-xl border object-cover`} />;
  }
  return <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl text-white`} style={{ backgroundColor: company.color }}><Icon className="h-5 w-5" /></div>;
}

function CompanyList({ companies, selectedCompanyId, onSelect, onAdd, onEdit, onDelete }: { companies: WorkCompany[]; selectedCompanyId: number | null; onSelect: (id: number) => void; onAdd: () => void; onEdit: (company: WorkCompany) => void; onDelete: (company: WorkCompany) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Companies</CardTitle>
          <CardDescription>Select a company to manage its folders and files.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {companies.length === 0 ? <EmptyState icon={Building2} title="No companies" description="Add manually or fetch history with a connector." /> : companies.map((company) => (
          <div key={company.id} className={`rounded-xl border p-3 transition ${selectedCompanyId === company.id ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"}`}>
            <button type="button" className="flex w-full min-w-0 items-center gap-3 text-left" onClick={() => onSelect(company.id)}>
              <CompanyLogo company={company} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{company.companyName}</p>
                <p className="truncate text-xs text-muted-foreground">{company.position}</p>
              </div>
              <Badge variant={company.endDate ? "outline" : "default"}>{company.endDate ? "Past" : "Current"}</Badge>
            </button>
            <div className="mt-3 flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(company)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(company)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentWorkspace({ company, folders, documents, selectedFolderId, selectedDocuments, onSelectFolder, onCreateFolder, onUploadFile, onEditFile, onDeleteFile, onDeleteFolder }: { company: WorkCompany | null; folders: WorkDocumentFolder[]; documents: WorkDocument[]; selectedFolderId: number | null; selectedDocuments: WorkDocument[]; onSelectFolder: (id: number | null) => void; onCreateFolder: () => void; onUploadFile: (folderId: number | null) => void; onEditFile: (doc: WorkDocument) => void; onDeleteFile: (doc: WorkDocument) => void; onDeleteFolder: (folder: WorkDocumentFolder) => void }) {
  const unfiledCount = documents.filter((doc) => !doc.folderId).length;
  if (!company) {
    return <Card><CardContent className="p-6"><EmptyState icon={Folder} title="Choose a company" description="Folders and files are always stored against a specific company." /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo company={company} size="lg" />
            <div className="min-w-0">
              <CardTitle className="truncate">{company.companyName}</CardTitle>
              <CardDescription>{folders.length} folders · {documents.length} files</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCreateFolder}><FolderPlus className="mr-2 h-4 w-4" /> Folder</Button>
            <Button size="sm" onClick={() => onUploadFile(selectedFolderId)}><Upload className="mr-2 h-4 w-4" /> File</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <FolderTile name="Unfiled" count={unfiledCount} color="#64748b" selected={selectedFolderId === null} onClick={() => onSelectFolder(null)} />
            {folders.map((folder) => (
              <FolderTile
                key={folder.id}
                name={folder.name}
                count={folder.documentsCount}
                color={folder.color}
                icon={folder.icon}
                selected={selectedFolderId === folder.id}
                onClick={() => onSelectFolder(folder.id)}
                onDelete={() => onDeleteFolder(folder)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{selectedFolderId ? folders.find((folder) => folder.id === selectedFolderId)?.name : "Unfiled"} Files</CardTitle>
            <CardDescription>Files are scoped to {company.companyName}.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => onUploadFile(selectedFolderId)}><FilePlus2 className="mr-2 h-4 w-4" /> Upload</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDocuments.length === 0 ? <EmptyState icon={FileText} title="No files here" description="Upload files directly into this company folder." /> : selectedDocuments.map((doc) => <DocumentRow key={doc.id} doc={doc} onEdit={() => onEditFile(doc)} onDelete={() => onDeleteFile(doc)} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function FolderTile({ name, count, color, icon = "Folder", selected, onClick, onDelete }: { name: string; count: number; color: string; icon?: string; selected: boolean; onClick: () => void; onDelete?: () => void }) {
  const Icon = iconMap[icon] || Folder;
  return (
    <div className={`group rounded-xl border p-4 transition ${selected ? "border-primary/50 bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"}`}>
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={onClick}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}20`, color }}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{count} files</p>
        </div>
      </button>
      {onDelete && <Button variant="ghost" size="sm" className="mt-2 h-8 w-full justify-start text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete folder</Button>}
    </div>
  );
}

function CompanyTimelineItem({ company, selected, onSelect, onEdit, onDelete }: { company: WorkCompany; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`relative flex gap-4 rounded-xl border bg-card p-4 transition ${selected ? "border-primary/50 shadow-sm" : "hover:border-primary/30"}`}>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-4 text-left">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><h3 className="font-semibold">{company.companyName}</h3><p className="text-sm text-muted-foreground">{company.position}</p></div>
            <Badge variant={company.endDate ? "outline" : "default"}>{company.endDate ? "Past" : "Current"}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <span className="text-muted-foreground"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{displayDate(company.startDate)} - {displayDate(company.endDate)}</span>
            <span className="font-medium">{company.tenureLabel}</span>
            <span className="font-mono">{formatCurrency(company.salaryMonthly)}/mo</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">PF {formatCurrency(company.estimatedPfAmount)}</Badge><Badge variant="outline">{company.documentsCount} files</Badge>{company.pfAccountNumber && <Badge variant="outline">{company.pfAccountNumber}</Badge>}</div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function CompanyDetail({ company, folders, documents, onAddFolder, onAddDocument, onEditCompany }: { company: WorkCompany | null; folders: WorkDocumentFolder[]; documents: WorkDocument[]; onAddFolder: () => void; onAddDocument: () => void; onEditCompany: () => void }) {
  if (!company) return <Card><CardContent className="p-6"><EmptyState icon={Building2} title="Select a company" description="Company details, folders, and files will appear here." /></CardContent></Card>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><CompanyLogo company={company} size="lg" /><div><CardTitle>{company.companyName}</CardTitle><CardDescription>{company.position}{company.location ? ` · ${company.location}` : ""}</CardDescription></div></div>
          <Button variant="outline" size="sm" onClick={onEditCompany}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Monthly salary" value={formatCurrency(company.salaryMonthly)} />
          <MiniStat label="Estimated PF" value={formatCurrency(company.estimatedPfAmount)} />
          <MiniStat label="Folders" value={String(folders.length)} />
          <MiniStat label="Files" value={String(documents.length)} />
          {company.notes && <p className="sm:col-span-2 rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground">{company.notes}</p>}
          <div className="flex flex-wrap gap-2 sm:col-span-2"><Button variant="outline" size="sm" onClick={onAddFolder}><FolderPlus className="mr-2 h-4 w-4" /> Folder</Button><Button variant="outline" size="sm" onClick={onAddDocument}><Upload className="mr-2 h-4 w-4" /> File</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryRow({ category, count, onDelete }: { category: WorkDocumentCategory; count: number; onDelete: () => void }) {
  const Icon = iconMap[category.icon] || FileText;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate font-medium">{category.name}</p><p className="text-xs text-muted-foreground">{count} files</p></div></div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

function DocumentRow({ doc, onEdit, onDelete }: { doc: WorkDocument; onEdit?: () => void; onDelete: () => void }) {
  const Icon = iconMap[doc.categoryIcon || "FileText"] || FileText;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${doc.categoryColor || "#64748b"}20`, color: doc.categoryColor || "#64748b" }}><Icon className="h-4 w-4" /></div>
        <div className="min-w-0"><p className="truncate font-medium">{doc.name}</p><p className="truncate text-xs text-muted-foreground">{doc.folderName || "Unfiled"} · {doc.categoryName || doc.documentType} · {doc.fileName}</p></div>
      </div>
      <div className="flex shrink-0 gap-1">{onEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>}<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div>
    </div>
  );
}

function PfEntryRow({ entry, onDelete }: { entry: WorkPfEntry; onDelete: () => void }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><div><p className="font-medium">{entry.month}</p><p className="text-xs text-muted-foreground">{entry.companyName || "General"} · {entry.source}</p></div><div className="flex items-center gap-2"><p className="font-mono font-semibold">{formatCurrency(entry.employeeAmount + entry.employerAmount + entry.interestAmount)}</p><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div></div>;
}

function WithdrawalRow({ withdrawal, onDelete }: { withdrawal: WorkPfWithdrawal; onDelete: () => void }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><div><p className="font-medium">{formatCurrency(withdrawal.amount)}</p><p className="text-xs text-muted-foreground">{withdrawal.companyName || "General"} · {format(parseISO(withdrawal.withdrawalDate), "dd MMM yyyy")}</p>{withdrawal.reason && <p className="mt-1 text-xs text-muted-foreground">{withdrawal.reason}</p>}</div><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div>;
}

function CompanyDialog({ company, open, onOpenChange, onSubmit }: { company: WorkCompany | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ companyName: "", position: "", location: "", employmentType: "full_time", salaryMonthly: 0, startDate: todayInput(), endDate: "", pfAccountNumber: "", employeePfMonthly: 0, employerPfMonthly: 0, color: "#2563eb", icon: "Building2", logoUrl: "", notes: "" });

  useEffect(() => {
    if (!open) return;
    setForm({ companyName: company?.companyName ?? "", position: company?.position ?? "", location: company?.location ?? "", employmentType: company?.employmentType ?? "full_time", salaryMonthly: company?.salaryMonthly ?? 0, startDate: company?.startDate ?? todayInput(), endDate: company?.endDate ?? "", pfAccountNumber: company?.pfAccountNumber ?? "", employeePfMonthly: company?.employeePfMonthly ?? 0, employerPfMonthly: company?.employerPfMonthly ?? 0, color: company?.color ?? "#2563eb", icon: company?.icon ?? "Building2", logoUrl: company?.logoUrl ?? "", notes: company?.notes ?? "" });
  }, [company, open]);

  const submit = () => {
    if (!form.companyName.trim() || !form.position.trim()) return;
    onSubmit({ ...form, companyName: form.companyName.trim(), position: form.position.trim(), location: form.location || null, endDate: form.endDate || null, pfAccountNumber: form.pfAccountNumber || null, logoUrl: form.logoUrl || null, notes: form.notes || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle><DialogDescription>Add role, tenure, PF estimate, and a company logo.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company"><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
          <Field label="Position"><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
          <Field label="Employment Type"><Select value={form.employmentType} onValueChange={(value) => setForm({ ...form, employmentType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employmentTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Monthly Salary"><Input type="number" value={form.salaryMonthly} onChange={(e) => setForm({ ...form, salaryMonthly: Number(e.target.value) })} /></Field>
          <Field label="PF Account No"><Input value={form.pfAccountNumber} onChange={(e) => setForm({ ...form, pfAccountNumber: e.target.value })} /></Field>
          <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End Date"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <Field label="Employee PF / Month"><Input type="number" value={form.employeePfMonthly} onChange={(e) => setForm({ ...form, employeePfMonthly: Number(e.target.value) })} /></Field>
          <Field label="Employer PF / Month"><Input type="number" value={form.employerPfMonthly} onChange={(e) => setForm({ ...form, employerPfMonthly: Number(e.target.value) })} /></Field>
          <Field label="Brand Color"><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
          <Field label="Icon"><Select value={form.icon} onValueChange={(value) => setForm({ ...form, icon: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{companyIcons.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent></Select></Field>
          <div className="sm:col-span-2">
            <Field label="Company Logo">
              <div className="flex items-center gap-3">
                {form.logoUrl ? <img src={form.logoUrl} alt="Company logo preview" className="h-12 w-12 rounded-xl border object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl border text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                <Input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, logoUrl: await readFileAsDataUrl(file) }); }} />
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
        <div className="flex justify-end"><Button onClick={submit}>{company ? "Save Changes" : "Save Company"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function FolderDialog({ open, onOpenChange, onSubmit, company }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; company: WorkCompany | null }) {
  const [form, setForm] = useState({ name: "", color: "#2563eb", icon: "Folder", notes: "" });
  useEffect(() => { if (open) setForm({ name: "", color: "#2563eb", icon: "Folder", notes: "" }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Folder</DialogTitle><DialogDescription>{company ? `Folder for ${company.companyName}` : "Select a company first."}</DialogDescription></DialogHeader>
        <Field label="Folder Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Color"><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field><Field label="Icon"><Select value={form.icon} onValueChange={(value) => setForm({ ...form, icon: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{folderIcons.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent></Select></Field></div>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="flex justify-end"><Button disabled={!company} onClick={() => company && form.name.trim() && onSubmit({ ...form, companyId: company.id, name: form.name.trim(), notes: form.notes || null })}>Create Folder</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ name: "", color: "#64748b", icon: "FileText" });
  useEffect(() => { if (open) setForm({ name: "", color: "#64748b", icon: "FileText" }); }, [open]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Document Category</DialogTitle><DialogDescription>Create a reusable file category.</DialogDescription></DialogHeader><Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Color"><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field><Field label="Icon"><Select value={form.icon} onValueChange={(value) => setForm({ ...form, icon: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(iconMap).map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent></Select></Field></div><div className="flex justify-end"><Button onClick={() => form.name.trim() && onSubmit({ ...form, name: form.name.trim() })}>Save Category</Button></div></DialogContent></Dialog>;
}

function DocumentDialog({ document, open, onOpenChange, onSubmit, companies, folders, categories, defaultCompanyId, defaultFolderId }: { document: WorkDocument | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; folders: WorkDocumentFolder[]; categories: WorkDocumentCategory[]; defaultCompanyId: number | null; defaultFolderId: number | null }) {
  const [form, setForm] = useState({ companyId: "", folderId: "", categoryId: "", name: "", documentType: "payslip" as WorkDocumentType, fileName: "", documentDate: todayInput(), notes: "" });
  useEffect(() => {
    if (!open) return;
    setForm({ companyId: String(document?.companyId ?? defaultCompanyId ?? ""), folderId: String(document?.folderId ?? defaultFolderId ?? ""), categoryId: String(document?.categoryId ?? ""), name: document?.name ?? "", documentType: document?.documentType ?? "payslip", fileName: document?.fileName ?? "", documentDate: document?.documentDate ?? todayInput(), notes: document?.notes ?? "" });
  }, [defaultCompanyId, defaultFolderId, document, open]);
  const availableFolders = folders.filter((folder) => !form.companyId || folder.companyId === Number(form.companyId));
  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit({ companyId: form.companyId ? Number(form.companyId) : null, folderId: form.folderId ? Number(form.folderId) : null, categoryId: form.categoryId ? Number(form.categoryId) : null, name: form.name.trim(), documentType: form.documentType, fileName: form.fileName || form.name.trim(), documentDate: form.documentDate || null, notes: form.notes || null });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{document ? "Edit File" : "Upload File"}</DialogTitle><DialogDescription>Files are saved against a company and can live inside a folder.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value, folderId: "" })}><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Folder"><Select value={form.folderId} onValueChange={(value) => setForm({ ...form, folderId: value })}><SelectTrigger><SelectValue placeholder="Unfiled" /></SelectTrigger><SelectContent>{availableFolders.map((folder) => <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Category"><Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Document Type"><Select value={form.documentType} onValueChange={(value) => setForm({ ...form, documentType: value as WorkDocumentType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{docTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="File Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Document Date"><Input type="date" value={form.documentDate} onChange={(e) => setForm({ ...form, documentDate: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Upload"><Input type="file" onChange={(e) => setForm({ ...form, fileName: e.target.files?.[0]?.name || form.fileName })} />{form.fileName && <p className="truncate text-xs text-muted-foreground">{form.fileName}</p>}</Field></div>
          <div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
        <div className="flex justify-end"><Button onClick={submit}>{document ? "Save Changes" : "Upload File"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function PfEntryDialog({ open, onOpenChange, onSubmit, companies, defaultCompanyId }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; defaultCompanyId: number | null }) {
  const [form, setForm] = useState({ companyId: "", month: monthInput(), employeeAmount: 0, employerAmount: 0, interestAmount: 0, source: "manual" as WorkPfSource, notes: "" });
  useEffect(() => { if (open) setForm({ companyId: String(defaultCompanyId ?? ""), month: monthInput(), employeeAmount: 0, employerAmount: 0, interestAmount: 0, source: "manual", notes: "" }); }, [defaultCompanyId, open]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add PF Month</DialogTitle><DialogDescription>Record employee, employer, and interest contribution for a month.</DialogDescription></DialogHeader><Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}><SelectTrigger><SelectValue placeholder="Optional company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Month"><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field><Field label="Employee"><Input type="number" value={form.employeeAmount} onChange={(e) => setForm({ ...form, employeeAmount: Number(e.target.value) })} /></Field><Field label="Employer"><Input type="number" value={form.employerAmount} onChange={(e) => setForm({ ...form, employerAmount: Number(e.target.value) })} /></Field></div><Field label="Interest"><Input type="number" value={form.interestAmount} onChange={(e) => setForm({ ...form, interestAmount: Number(e.target.value) })} /></Field><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex justify-end"><Button onClick={() => onSubmit({ ...form, companyId: form.companyId ? Number(form.companyId) : null, notes: form.notes || null })}>Save PF Entry</Button></div></DialogContent></Dialog>;
}

function WithdrawalDialog({ open, onOpenChange, onSubmit, companies, defaultCompanyId }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; defaultCompanyId: number | null }) {
  const [form, setForm] = useState({ companyId: "", amount: 0, withdrawalDate: todayInput(), reason: "", notes: "" });
  useEffect(() => { if (open) setForm({ companyId: String(defaultCompanyId ?? ""), amount: 0, withdrawalDate: todayInput(), reason: "", notes: "" }); }, [defaultCompanyId, open]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>PF Withdrawal</DialogTitle><DialogDescription>Record a PF withdrawal so the balance reflects money already taken out.</DialogDescription></DialogHeader><Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}><SelectTrigger><SelectValue placeholder="Optional company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field><Field label="Date"><Input type="date" value={form.withdrawalDate} onChange={(e) => setForm({ ...form, withdrawalDate: e.target.value })} /></Field></div><Field label="Reason"><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex justify-end"><Button onClick={() => form.amount > 0 && onSubmit({ ...form, companyId: form.companyId ? Number(form.companyId) : null, reason: form.reason || null, notes: form.notes || null })}>Save Withdrawal</Button></div></DialogContent></Dialog>;
}

function ProfileDialog({ open, onOpenChange, onSubmit, profile }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; profile: OneworkProfile | null }) {
  const [form, setForm] = useState({ uanNumber: "", epfoMemberId: "" });
  useEffect(() => { if (open) setForm({ uanNumber: profile?.uanNumber || "", epfoMemberId: profile?.epfoMemberId || "" }); }, [open, profile]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>UAN and EPFO Details</DialogTitle><DialogDescription>Store tracking identifiers for manual PF records and future secure EPFO sync.</DialogDescription></DialogHeader><Field label="UAN Number"><Input value={form.uanNumber} onChange={(e) => setForm({ ...form, uanNumber: e.target.value })} /></Field><Field label="EPFO Member ID"><Input value={form.epfoMemberId} onChange={(e) => setForm({ ...form, epfoMemberId: e.target.value })} /></Field><div className="flex justify-end"><Button onClick={() => onSubmit({ uanNumber: form.uanNumber || null, epfoMemberId: form.epfoMemberId || null })}>Save UAN</Button></div></DialogContent></Dialog>;
}

function HistoryFetchDialog({ open, isPending, onOpenChange, onSubmit }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { userId: string; password: string }) => void }) {
  const [form, setForm] = useState({ userId: "", password: "" });
  useEffect(() => { if (open) setForm({ userId: "", password: "" }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Fetch Company History</DialogTitle><DialogDescription>Credentials are sent for this session only and are not stored. A configured official connector is required for real imports.</DialogDescription></DialogHeader>
        <Field label="User ID"><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} /></Field>
        <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <div className="flex justify-end"><Button disabled={isPending || !form.userId || !form.password} onClick={() => onSubmit(form)}>{isPending ? "Checking..." : "Fetch History"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
