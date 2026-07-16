import React, { useEffect, useMemo, useState } from "react";
import {
  getGetDashboardSummaryQueryKey,
  getGetOneworkSummaryQueryKey,
  type OneworkProfile,
  type WorkCompany,
  type WorkCompanyInput,
  type WorkDocument,
  type WorkDocumentCategory,
  type WorkDocumentFolder,
  type WorkDocumentType,
  type WorkDocumentFolderUpdate,
  type WorkPfEntry,
  type WorkPfSource,
  type WorkPfWithdrawal,
  type WorkSalaryRecord,
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
  useUpdateWorkPfEntry,
  useUpdateWorkPfWithdrawal,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Cloud,
  Download,
  DownloadCloud,
  Eye,
  FileCheck2,
  FilePlus2,
  FileSignature,
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Landmark,
  LockKeyhole,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  ScrollText,
  Search,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
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

type DialogMode = "company" | "document" | "folder" | "category" | "pf" | "withdrawal" | "profile" | "history" | "drive" | "epfo" | "passbook" | "cv" | "salary" | null;
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
  | { type: "pf"; entry: WorkPfEntry; name: string }
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
const companyLogoDomains: Array<[string, string]> = [
  ["solera", "solera.com"],
  ["smart drive", "solera.com"],
  ["smartdrive", "solera.com"],
  ["quality ai", "qualityai.com"],
  ["accion", "accionlabs.com"],
  ["wells fargo", "wellsfargo.com"],
  ["virtusa", "virtusa.com"],
  ["jd sports", "jdsports.com"],
  ["conduent", "conduent.com"],
  ["dell", "dell.com"],
  ["qatar airways", "qatarairways.com"],
];

const docTypes: Array<{ value: WorkDocumentType; label: string }> = [
  { value: "offer_letter", label: "Offer letter" },
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

function pfEntryTotal(entry: WorkPfEntry) {
  return entry.employeeAmount + entry.employerAmount + entry.interestAmount;
}

function pfMonthDateLabel(month: string) {
  return format(parseISO(`${month}-01`), "dd MMM yyyy");
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function logoUrlForCompanyName(companyName: string) {
  const normalized = companyName.toLowerCase();
  const match = companyLogoDomains.find(([name]) => normalized.includes(name));
  return match ? `https://www.google.com/s2/favicons?domain=${match[1]}&sz=128` : "";
}

function openDocumentFile(doc: WorkDocument) {
  if (!doc.fileUrl) return;
  window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
}

function downloadDocumentFile(doc: WorkDocument) {
  if (!doc.fileUrl) return;
  const anchor = document.createElement("a");
  anchor.href = doc.fileUrl;
  anchor.download = doc.fileName || doc.name;
  anchor.click();
}

function whatsappShareUrl(doc: WorkDocument) {
  const text = encodeURIComponent(`${doc.name} - ${doc.fileName}${doc.fileUrl ? `\n${doc.fileUrl}` : ""}`);
  return `https://wa.me/?text=${text}`;
}

function emailShareUrl(doc: WorkDocument) {
  const subject = encodeURIComponent(doc.name);
  const body = encodeURIComponent(`Sharing ${doc.name} (${doc.fileName}).${doc.fileUrl ? `\n\n${doc.fileUrl}` : ""}`);
  return `mailto:?subject=${subject}&body=${body}`;
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
  const [editingFolder, setEditingFolder] = useState<WorkDocumentFolder | null>(null);
  const [editingPfEntry, setEditingPfEntry] = useState<WorkPfEntry | null>(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState<WorkPfWithdrawal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const mutationHandlers = (successTitle: string, closeDialog = true) => ({
    onSuccess: () => {
      toast({ title: successTitle });
      invalidateOneWork(queryClient);
      if (closeDialog) setDialog(null);
      setEditingCompany(null);
      setEditingDocument(null);
      setEditingFolder(null);
      setEditingPfEntry(null);
      setEditingWithdrawal(null);
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
  const updatePfEntry = useUpdateWorkPfEntry({ mutation: mutationHandlers("PF entry updated") });
  const deletePfEntry = useDeleteWorkPfEntry({ mutation: mutationHandlers("PF entry deleted", false) });
  const createWithdrawal = useCreateWorkPfWithdrawal({ mutation: mutationHandlers("PF withdrawal recorded") });
  const updateWithdrawal = useUpdateWorkPfWithdrawal({ mutation: mutationHandlers("PF withdrawal updated") });
  const deleteWithdrawal = useDeleteWorkPfWithdrawal({ mutation: mutationHandlers("PF withdrawal deleted", false) });
  const updateProfile = useUpdateOneworkProfile({ mutation: mutationHandlers("UAN details saved") });

  const createFolder = useMutation({
    mutationFn: (data: any) => apiRequest<WorkDocumentFolder>("/api/onework/folders", { method: "POST", body: JSON.stringify(data) }),
    ...mutationHandlers("Folder created"),
  });
  const updateFolder = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkDocumentFolderUpdate }) => apiRequest<WorkDocumentFolder>(`/api/onework/folders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...mutationHandlers("Folder updated"),
  });
  const createEssentialFolders = useMutation({
    mutationFn: (companyId: number) => apiRequest<{ folders: WorkDocumentFolder[] }>(`/api/onework/companies/${companyId}/essential-folders`, { method: "POST" }),
    onSuccess: (result) => {
      toast({ title: "Company folders ready", description: `${result.folders.length} organized folders available for this company.` });
      invalidateOneWork(queryClient);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "Could not create folders", variant: "destructive" }),
  });
  const deleteFolder = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/api/onework/folders/${id}`, { method: "DELETE" }),
    ...mutationHandlers("Folder deleted", false),
  });
  const connectDrive = useMutation({
    mutationFn: (data: { email: string }) => apiRequest<OneworkProfile>("/api/onework/google-drive/connect", { method: "POST", body: JSON.stringify(data) }),
    ...mutationHandlers("Google Drive connected"),
  });
  const syncDrive = useMutation({
    mutationFn: () => apiRequest<{ syncedCount: number }>("/api/onework/google-drive/sync", { method: "POST" }),
    onSuccess: (result) => {
      toast({ title: "Google Drive synced", description: `${result.syncedCount} local files marked as synced.` });
      invalidateOneWork(queryClient);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "Google Drive sync failed", variant: "destructive" }),
  });
  const syncEpfo = useMutation({
    mutationFn: (data: { uan: string; password: string }) => apiRequest<{ message: string; importedCompanies: number }>("/api/onework/epfo/sync", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (result) => {
      toast({ title: "EPFO ledger synced", description: result.message });
      invalidateOneWork(queryClient);
      setDialog(null);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "EPFO sync failed", variant: "destructive" }),
  });
  const parsePassbook = useMutation({
    mutationFn: (data: { passbookText: string }) => apiRequest<{ message: string }>("/api/onework/epfo/parse-passbook", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (result) => toast({ title: "Passbook parsed", description: result.message }),
    onError: (error) => toast({ title: error instanceof Error ? error.message : "Passbook parse failed", variant: "destructive" }),
  });
  const importCv = useMutation({
    mutationFn: async (data: { cvText: string; fileName?: string }) => {
      const parsed = await apiRequest<{ companies: WorkCompanyInput[] }>("/api/onework/cv/parse", { method: "POST", body: JSON.stringify(data) });
      for (const company of parsed.companies) {
        await apiRequest<WorkCompany>("/api/onework/companies", { method: "POST", body: JSON.stringify({ ...company, logoUrl: company.logoUrl || logoUrlForCompanyName(company.companyName) }) });
      }
      return parsed;
    },
    onSuccess: (result) => {
      toast({ title: "CV imported", description: `${result.companies.length} companies parsed into the timeline.` });
      invalidateOneWork(queryClient);
      setDialog(null);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "CV import failed", variant: "destructive" }),
  });
  const uploadSalaryDocument = useMutation({
    mutationFn: (data: any) => apiRequest<{ document: WorkDocument; salaryRecord: WorkSalaryRecord | null; company: WorkCompany }>("/api/onework/salary-documents", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (result) => {
      toast({
        title: "Salary document saved",
        description: result.salaryRecord ? `Parsed ${formatCurrency(result.salaryRecord.netSalary)} net salary for ${result.salaryRecord.month}.` : "Document saved in the company folder.",
      });
      invalidateOneWork(queryClient);
      setDialog(null);
    },
    onError: (error) => toast({ title: error instanceof Error ? error.message : "Salary document upload failed", variant: "destructive" }),
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
  const companySalaryRecords = selectedCompany ? [...summary.salaryRecords].filter((record) => record.companyId === selectedCompany.id).sort((a, b) => a.month.localeCompare(b.month)) : [];
  const selectedFolder = companyFolders.find((folder) => folder.id === selectedFolderId) ?? null;
  const selectedFolderDocuments = selectedFolder ? companyDocuments.filter((doc) => doc.folderId === selectedFolder.id) : [];
  const activeCompany = companies.find((company) => !company.endDate);
  const pfEntries = [...summary.pfEntries].sort((a, b) => b.month.localeCompare(a.month));
  const withdrawals = [...summary.pfWithdrawals].sort((a, b) => b.withdrawalDate.localeCompare(a.withdrawalDate));
  const companyPfSummaries = companies.map((company) => {
    const contribution = summary.pfEntries
      .filter((entry) => entry.companyId === company.id)
      .reduce((sum, entry) => sum + pfEntryTotal(entry), 0);
    const withdrawn = summary.pfWithdrawals
      .filter((withdrawal) => withdrawal.companyId === company.id)
      .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    return { company, contribution, withdrawn, balance: Math.max(0, contribution - withdrawn) };
  });
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
  const totalPfWithdrawn = summary.pfWithdrawalsTotal;
  const latestSalaryRecord = [...(summary.salaryRecords ?? [])].sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
  const latestCompanySalaryRecord = companySalaryRecords.at(-1) ?? null;

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
          .map((doc) => ({ kind: "File", title: doc.name, subtitle: `${doc.companyName || "General"} / ${doc.folderName || "No folder"} / ${doc.fileName}`, companyId: doc.companyId, folderId: doc.folderId })),
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

  const openFolderDialog = (folder?: WorkDocumentFolder) => {
    setEditingFolder(folder ?? null);
    setDialog("folder");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "company") deleteCompany.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "document") deleteDocument.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "folder") deleteFolder.mutate(deleteTarget.id);
    if (deleteTarget.type === "category") deleteCategory.mutate({ id: deleteTarget.id });
    if (deleteTarget.type === "pf") {
      const { entry } = deleteTarget;
      if (entry.id < 0) {
        createPfEntry.mutate({
          data: {
            companyId: entry.companyId,
            month: entry.month,
            employeeAmount: 0,
            employerAmount: 0,
            interestAmount: 0,
            source: "manual",
            notes: "Skipped generated PF contribution",
          },
        });
      } else {
        deletePfEntry.mutate({ id: entry.id });
      }
    }
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
              <Badge variant="secondary" className="gap-1"><Landmark className="h-3 w-3" /> PF ledger</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">OneWork CareerOS Dashboard</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Organize company history, folders, uploaded files, PF contributions, withdrawals, UAN details, and Google Drive sync from one work timeline.
            </p>
            <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search OneWork companies, folders, files, notes..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openCompanyDialog()}><Plus className="mr-2 h-4 w-4" /> Company</Button>
                <Button variant="outline" onClick={() => setDialog("salary")}><ReceiptText className="mr-2 h-4 w-4" /> Salary</Button>
                <Button variant="outline" onClick={() => setDialog("cv")}><FileText className="mr-2 h-4 w-4" /> CV</Button>
                <Button variant="outline" onClick={() => setDialog("epfo")}><LockKeyhole className="mr-2 h-4 w-4" /> EPFO</Button>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Sync status</p>
                <p className="mt-2 text-lg font-semibold">{summary.profile?.googleDriveConnected === "true" ? "Google Drive connected" : "Local workspace"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.profile?.googleDriveEmail || "Connect Drive or use local/Supabase-ready file records."}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cloud className="h-6 w-6" />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialog("drive")}><Cloud className="mr-2 h-4 w-4" /> Drive</Button>
              <Button variant="outline" size="sm" onClick={() => syncDrive.mutate()} disabled={syncDrive.isPending}><DownloadCloud className="mr-2 h-4 w-4" /> Sync</Button>
              <Button variant="outline" size="sm" onClick={() => setDialog("profile")}><ShieldCheck className="mr-2 h-4 w-4" /> UAN</Button>
              <Button variant="outline" size="sm" onClick={() => setDialog("passbook")}><FileCheck2 className="mr-2 h-4 w-4" /> Passbook</Button>
            </div>
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
        <MetricCard title="Latest In-hand" value={formatCurrency(latestSalaryRecord?.netSalary ?? currentCompany?.salaryMonthly ?? 0)} icon={ReceiptText} tone="text-teal-600" />
        <MetricCard title="Highest CTC" value={formatCurrency(annualize(highestMonthlySalary))} icon={TrendingUp} tone="text-lime-600" />
        <MetricCard title="Companies Worked" value={String(summary.totalCompanies)} icon={Building2} tone="text-blue-600" />
        <MetricCard title="Total Documents" value={String(summary.documents.length)} icon={FileText} tone="text-amber-600" />
        <MetricCard title="PF Balance" value={formatCurrency(summary.pfBalance)} icon={Landmark} tone="text-emerald-600" />
        <MetricCard title="PF Withdrawn" value={formatCurrency(totalPfWithdrawn)} icon={TrendingDown} tone="text-orange-600" />
        <MetricCard title="Average Hike" value={formatPercent(averageAnnualHike)} icon={BarChart3} tone="text-pink-600" />
        <MetricCard title="Current Duration" value={currentCompany?.tenureLabel ?? "0 mo"} icon={CalendarDays} tone="text-indigo-600" />
        <MetricCard title="Drive Files" value={String(summary.documents.filter((doc) => doc.googleDriveFileId).length)} icon={Cloud} tone="text-sky-600" />
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[680px]">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
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
              onCreateFolder={() => openFolderDialog()}
              onUploadFile={(folderId) => openDocumentDialog(undefined, folderId)}
              onEditFile={(doc) => openDocumentDialog(doc, doc.folderId)}
              onDeleteFile={(doc) => setDeleteTarget({ type: "document", id: doc.id, name: doc.name })}
              onEditFolder={openFolderDialog}
              onDeleteFolder={(folder) => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
              onCreateEssentials={() => selectedCompany && createEssentialFolders.mutate(selectedCompany.id)}
              isCreatingEssentials={createEssentialFolders.isPending}
            />
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
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
            <SalaryWorkspace
              company={selectedCompany}
              records={companySalaryRecords}
              latestRecord={latestCompanySalaryRecord}
              onEditCompany={() => selectedCompany && openCompanyDialog(selectedCompany)}
              onUploadSalary={() => setDialog("salary")}
              onCreateFolders={() => selectedCompany && createEssentialFolders.mutate(selectedCompany.id)}
              isCreatingFolders={createEssentialFolders.isPending}
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
              onAddFolder={() => openFolderDialog()}
              onAddDocument={() => openDocumentDialog(undefined, selectedFolderId)}
              onEditCompany={() => selectedCompany && openCompanyDialog(selectedCompany)}
            />
          </div>
        </TabsContent>

        <TabsContent value="pf" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companyPfSummaries.map(({ company, contribution, withdrawn, balance }) => (
              <CompanyPfCard
                key={company.id}
                company={company}
                contribution={contribution}
                withdrawn={withdrawn}
                balance={balance}
                selected={selectedCompanyId === company.id}
                onSelect={() => setSelectedCompanyId(company.id)}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>PF Contributions</CardTitle>
                  <CardDescription>Every saved or estimated month is treated as a 1st-of-month PF contribution.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingPfEntry(null); setDialog("pf"); }}><Plus className="mr-2 h-4 w-4" /> PF Month</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Contributions" value={formatCurrency(summary.pfContributions)} />
                  <MiniStat label="Withdrawals" value={formatCurrency(summary.pfWithdrawalsTotal)} />
                  <MiniStat label="Balance" value={formatCurrency(summary.pfBalance)} />
                </div>
                <Separator />
                {pfEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No manual PF entries yet. Company PF estimates are still included in the balance.</p>
                ) : (
                  <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                    {pfEntries.map((entry) => (
                      <PfEntryRow
                        key={`${entry.id}-${entry.companyId}-${entry.month}`}
                        entry={entry}
                        onEdit={() => {
                          setEditingPfEntry(entry);
                          setDialog("pf");
                        }}
                        onDelete={() => setDeleteTarget({ type: "pf", entry, name: `${entry.companyName || "General"} ${entry.month}` })}
                      />
                    ))}
                  </div>
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
                {withdrawals.length === 0 ? (
                  <EmptyState icon={TrendingDown} title="No withdrawals" description="Record withdrawals to keep PF balance accurate." />
                ) : (
                  withdrawals.map((withdrawal) => (
                    <WithdrawalRow
                      key={withdrawal.id}
                      withdrawal={withdrawal}
                      onEdit={() => {
                        setEditingWithdrawal(withdrawal);
                        setDialog("withdrawal");
                      }}
                      onDelete={() => setDeleteTarget({ type: "withdrawal", id: withdrawal.id, name: formatCurrency(withdrawal.amount) })}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CompanyDialog company={editingCompany} open={dialog === "company"} onOpenChange={(open) => { setDialog(open ? "company" : null); if (!open) setEditingCompany(null); }} onSubmit={(data) => editingCompany ? updateCompany.mutate({ id: editingCompany.id, data }) : createCompany.mutate({ data })} />
      <FolderDialog
        folder={editingFolder}
        open={dialog === "folder"}
        company={selectedCompany}
        onOpenChange={(open) => { setDialog(open ? "folder" : null); if (!open) setEditingFolder(null); }}
        onSubmit={(data) => editingFolder ? updateFolder.mutate({ id: editingFolder.id, data }) : createFolder.mutate(data)}
      />
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
      <PfEntryDialog
        entry={editingPfEntry}
        companies={summary.companies}
        defaultCompanyId={selectedCompany?.id ?? null}
        open={dialog === "pf"}
        onOpenChange={(open) => { setDialog(open ? "pf" : null); if (!open) setEditingPfEntry(null); }}
        onSubmit={(data) => editingPfEntry && editingPfEntry.id > 0 ? updatePfEntry.mutate({ id: editingPfEntry.id, data }) : createPfEntry.mutate({ data })}
      />
      <WithdrawalDialog
        withdrawal={editingWithdrawal}
        companies={summary.companies}
        defaultCompanyId={selectedCompany?.id ?? null}
        open={dialog === "withdrawal"}
        onOpenChange={(open) => { setDialog(open ? "withdrawal" : null); if (!open) setEditingWithdrawal(null); }}
        onSubmit={(data) => editingWithdrawal ? updateWithdrawal.mutate({ id: editingWithdrawal.id, data }) : createWithdrawal.mutate({ data })}
      />
      <ProfileDialog profile={summary.profile} open={dialog === "profile"} onOpenChange={(open) => setDialog(open ? "profile" : null)} onSubmit={(data) => updateProfile.mutate({ data })} />
      <HistoryFetchDialog open={dialog === "history"} isPending={fetchHistory.isPending} onOpenChange={(open) => setDialog(open ? "history" : null)} onSubmit={(data) => fetchHistory.mutate(data)} />
      <DriveDialog profile={summary.profile} open={dialog === "drive"} isPending={connectDrive.isPending} onOpenChange={(open) => setDialog(open ? "drive" : null)} onSubmit={(data) => connectDrive.mutate(data)} />
      <EpfoSyncDialog profile={summary.profile} open={dialog === "epfo"} isPending={syncEpfo.isPending} onOpenChange={(open) => setDialog(open ? "epfo" : null)} onSubmit={(data) => syncEpfo.mutate(data)} />
      <PassbookDialog open={dialog === "passbook"} isPending={parsePassbook.isPending} onOpenChange={(open) => setDialog(open ? "passbook" : null)} onSubmit={(data) => parsePassbook.mutate(data)} />
      <CvImportDialog open={dialog === "cv"} isPending={importCv.isPending} onOpenChange={(open) => setDialog(open ? "cv" : null)} onSubmit={(data) => importCv.mutate(data)} />
      <SalaryUploadDialog companies={summary.companies} defaultCompanyId={selectedCompany?.id ?? null} open={dialog === "salary"} isPending={uploadSalaryDocument.isPending} onOpenChange={(open) => setDialog(open ? "salary" : null)} onSubmit={(data) => uploadSalaryDocument.mutate(data)} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Generated PF rows are skipped by saving a zero-value override for that month.
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{value}</p></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/45" /><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function CompanyLogo({ company, size = "md" }: { company: WorkCompany; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const Icon = iconMap[company.icon] || Building2;
  const logoUrl = company.logoUrl || logoUrlForCompanyName(company.companyName);
  if (logoUrl) {
    return <img src={logoUrl} alt={`${company.companyName} logo`} className={`${sizeClass} shrink-0 rounded-xl border bg-background object-contain p-1`} />;
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
        {companies.length === 0 ? <EmptyState icon={Building2} title="No companies" description="Add manually or fetch history with a connector." /> : companies.map((company) => {
          const isCurrent = !company.endDate;
          return (
          <div key={company.id} className={`overflow-hidden rounded-xl border p-3 transition ${selectedCompanyId === company.id ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"} ${isCurrent ? "bg-gradient-to-br from-emerald-500/10 via-card to-cyan-500/5" : "bg-gradient-to-br from-muted/30 via-card to-card"}`}>
            <button type="button" className="flex w-full min-w-0 items-center gap-3 text-left" onClick={() => onSelect(company.id)}>
              <CompanyLogo company={company} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{company.companyName}</p>
                <p className="truncate text-xs text-muted-foreground">{company.position}</p>
              </div>
              <Badge variant={isCurrent ? "default" : "outline"} className={isCurrent ? "bg-emerald-600" : ""}>{isCurrent ? "Current" : "Past"}</Badge>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-background/70 p-2"><span className="text-muted-foreground">PF</span><p className="font-mono font-semibold">{formatCurrency(company.estimatedPfAmount)}</p></div>
              <div className="rounded-lg bg-background/70 p-2"><span className="text-muted-foreground">Tenure</span><p className="font-medium">{company.tenureLabel}</p></div>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(company)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(company)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        )})}
      </CardContent>
    </Card>
  );
}

function DocumentWorkspace({ company, folders, documents, selectedFolderId, selectedDocuments, onSelectFolder, onCreateFolder, onUploadFile, onEditFile, onDeleteFile, onEditFolder, onDeleteFolder, onCreateEssentials, isCreatingEssentials }: { company: WorkCompany | null; folders: WorkDocumentFolder[]; documents: WorkDocument[]; selectedFolderId: number | null; selectedDocuments: WorkDocument[]; onSelectFolder: (id: number | null) => void; onCreateFolder: () => void; onUploadFile: (folderId: number | null) => void; onEditFile: (doc: WorkDocument) => void; onDeleteFile: (doc: WorkDocument) => void; onEditFolder: (folder: WorkDocumentFolder) => void; onDeleteFolder: (folder: WorkDocumentFolder) => void; onCreateEssentials: () => void; isCreatingEssentials: boolean }) {
  if (!company) {
    return <Card><CardContent className="p-6"><EmptyState icon={Folder} title="Choose a company" description="Folders and files are always stored against a specific company." /></CardContent></Card>;
  }
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;

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
            <Button variant="outline" size="sm" onClick={onCreateEssentials} disabled={isCreatingEssentials}><FolderPlus className="mr-2 h-4 w-4" /> Essentials</Button>
            <Button variant="outline" size="sm" onClick={onCreateFolder}><FolderPlus className="mr-2 h-4 w-4" /> Folder</Button>
            <Button size="sm" disabled={!selectedFolder} onClick={() => selectedFolder && onUploadFile(selectedFolder.id)}><Upload className="mr-2 h-4 w-4" /> File</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {folders.length === 0 ? (
            <EmptyState icon={FolderPlus} title="No folders yet" description="Create folders for payslips, PF statements, offer letters, tax files, and company documents." />
          ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {folders.map((folder) => (
              <FolderTile
                key={folder.id}
                name={folder.name}
                count={folder.documentsCount}
                color={folder.color}
                icon={folder.icon}
                selected={selectedFolderId === folder.id}
                onClick={() => onSelectFolder(folder.id)}
                onEdit={() => onEditFolder(folder)}
                onDelete={() => onDeleteFolder(folder)}
              />
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{selectedFolder?.name ?? "Select a folder"} Files</CardTitle>
            <CardDescription>{selectedFolder ? `Files inside ${selectedFolder.name} for ${company.companyName}.` : "Choose a folder above to see and upload files."}</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={!selectedFolder} onClick={() => selectedFolder && onUploadFile(selectedFolder.id)}><FilePlus2 className="mr-2 h-4 w-4" /> Upload</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedFolder ? (
            <EmptyState icon={Folder} title="No folder selected" description="Select a folder to view files, or create one for this company." />
          ) : selectedDocuments.length === 0 ? (
            <EmptyState icon={FileText} title="No files here" description="Upload files directly into this company folder." />
          ) : (
            selectedDocuments.map((doc) => <DocumentRow key={doc.id} doc={doc} onEdit={() => onEditFile(doc)} onDelete={() => onDeleteFile(doc)} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FolderTile({ name, count, color, icon = "Folder", selected, onClick, onEdit, onDelete }: { name: string; count: number; color: string; icon?: string; selected: boolean; onClick: () => void; onEdit?: () => void; onDelete?: () => void }) {
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
      <div className="mt-2 flex gap-1">
        {onEdit && <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start text-muted-foreground" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>}
        {onDelete && <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>}
      </div>
    </div>
  );
}

function CompanyTimelineItem({ company, selected, onSelect, onEdit, onDelete }: { company: WorkCompany; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  const isCurrent = !company.endDate;
  return (
    <div className={`relative flex gap-4 overflow-hidden rounded-xl border p-4 transition ${selected ? "border-primary/50 shadow-sm" : "hover:border-primary/30"} ${isCurrent ? "bg-gradient-to-br from-emerald-500/10 via-card to-sky-500/5" : "bg-gradient-to-br from-muted/40 via-card to-card"}`}>
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: company.color }} />
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-4 text-left">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><h3 className="font-semibold">{company.companyName}</h3><p className="text-sm text-muted-foreground">{company.position}</p></div>
            <Badge variant={isCurrent ? "default" : "outline"} className={isCurrent ? "bg-emerald-600" : ""}>{isCurrent ? "Current" : "Past"}</Badge>
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

function CompanyPfCard({ company, contribution, withdrawn, balance, selected, onSelect }: { company: WorkCompany; contribution: number; withdrawn: number; balance: number; selected: boolean; onSelect: () => void }) {
  const isCurrent = !company.endDate;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-xl border p-4 text-left transition hover:border-primary/40 ${selected ? "border-primary/60 shadow-sm" : ""} ${isCurrent ? "bg-gradient-to-br from-emerald-500/10 via-card to-cyan-500/5" : "bg-gradient-to-br from-muted/40 via-card to-card"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo company={company} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{company.companyName}</p>
            <p className="text-xs text-muted-foreground">{displayDate(company.startDate)} - {displayDate(company.endDate)}</p>
          </div>
        </div>
        <Badge variant={isCurrent ? "default" : "outline"} className={isCurrent ? "bg-emerald-600" : ""}>{isCurrent ? "Recurring" : "Closed"}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-background/75 p-2">
          <span className="text-muted-foreground">Added</span>
          <p className="mt-1 font-mono font-semibold">{formatCurrency(contribution)}</p>
        </div>
        <div className="rounded-lg bg-background/75 p-2">
          <span className="text-muted-foreground">Withdrawn</span>
          <p className="mt-1 font-mono font-semibold text-orange-600">{formatCurrency(withdrawn)}</p>
        </div>
        <div className="rounded-lg bg-background/75 p-2">
          <span className="text-muted-foreground">Balance</span>
          <p className="mt-1 font-mono font-semibold text-emerald-600">{formatCurrency(balance)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        PF monthly: {formatCurrency(company.employeePfMonthly + company.employerPfMonthly)}
      </p>
    </button>
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

function SalaryWorkspace({ company, records, latestRecord, onEditCompany, onUploadSalary, onCreateFolders, isCreatingFolders }: { company: WorkCompany | null; records: WorkSalaryRecord[]; latestRecord: WorkSalaryRecord | null; onEditCompany: () => void; onUploadSalary: () => void; onCreateFolders: () => void; isCreatingFolders: boolean }) {
  if (!company) {
    return <Card><CardContent className="p-6"><EmptyState icon={ReceiptText} title="Choose a company" description="Select a company to track CTC, salary slips, and in-hand salary." /></CardContent></Card>;
  }

  const annualCtc = annualize(company.salaryMonthly);
  const currentNet = latestRecord?.netSalary ?? company.salaryMonthly;
  const currentGross = latestRecord?.grossSalary ?? company.salaryMonthly;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Salary and CTC</CardTitle>
            <CardDescription>{company.companyName} compensation, in-hand salary, and uploaded salary documents.</CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCreateFolders} disabled={isCreatingFolders}><FolderPlus className="mr-2 h-4 w-4" /> Folders</Button>
            <Button variant="outline" size="sm" onClick={onEditCompany}><Pencil className="mr-2 h-4 w-4" /> Edit CTC</Button>
            <Button size="sm" onClick={onUploadSalary}><ReceiptText className="mr-2 h-4 w-4" /> Upload Salary</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Package / CTC" value={formatCurrency(annualCtc)} />
            <MiniStat label="Gross salary" value={formatCurrency(currentGross)} />
            <MiniStat label="In-hand salary" value={formatCurrency(currentNet)} />
          </div>
          <SalaryChart records={records} fallbackMonthly={company.salaryMonthly} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Salary Records</CardTitle>
          <CardDescription>Payslips, offer letters, and hike letters can update this timeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No salary slips parsed" description="Upload a payslip or offer letter to start the salary graph." />
          ) : (
            [...records].reverse().map((record) => (
              <div key={record.id} className="grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-medium">{format(parseISO(`${record.month}-01`), "MMM yyyy")} · {record.companyName}</p>
                  <p className="text-xs text-muted-foreground">{record.source.replace("_", " ")}{record.notes ? ` · ${record.notes}` : ""}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-right font-mono text-xs">
                  <span>{formatCurrency(record.netSalary)}</span>
                  <span>{formatCurrency(record.grossSalary)}</span>
                  <span>{formatCurrency(record.ctcAnnual)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SalaryChart({ records, fallbackMonthly }: { records: WorkSalaryRecord[]; fallbackMonthly: number }) {
  const chartRecords = records.length ? records.slice(-12) : [{ id: 0, month: monthInput(), netSalary: fallbackMonthly, grossSalary: fallbackMonthly, ctcAnnual: annualize(fallbackMonthly), source: "current", companyId: 0, companyName: "", documentId: null, notes: null, createdAt: new Date().toISOString() }];
  const maxValue = Math.max(...chartRecords.flatMap((record) => [record.netSalary, record.grossSalary, record.ctcAnnual / 12, 1]));
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Net</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Gross</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> CTC / month</span>
      </div>
      <div className="grid min-h-56 grid-flow-col items-end gap-3 overflow-x-auto pb-1">
        {chartRecords.map((record) => {
          const ctcMonthly = record.ctcAnnual / 12;
          return (
            <div key={`${record.id}-${record.month}`} className="flex w-16 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1 rounded-lg bg-background/80 px-1 py-2">
                <div className="w-3 rounded-t bg-emerald-500" style={{ height: `${Math.max(4, (record.netSalary / maxValue) * 100)}%` }} />
                <div className="w-3 rounded-t bg-sky-500" style={{ height: `${Math.max(4, (record.grossSalary / maxValue) * 100)}%` }} />
                <div className="w-3 rounded-t bg-violet-500" style={{ height: `${Math.max(4, (ctcMonthly / maxValue) * 100)}%` }} />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">{format(parseISO(`${record.month}-01`), "MMM yy")}</p>
            </div>
          );
        })}
      </div>
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
        <div className="min-w-0"><p className="truncate font-medium">{doc.name}</p><p className="truncate text-xs text-muted-foreground">{doc.folderName || "No folder"} · {doc.categoryName || doc.documentType} · {doc.fileName}</p></div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!doc.fileUrl} onClick={() => openDocumentFile(doc)} title="Preview"><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!doc.fileUrl} onClick={() => downloadDocumentFile(doc)} title="Download"><Download className="h-4 w-4" /></Button>
        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Share to WhatsApp"><a href={whatsappShareUrl(doc)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Send email"><a href={emailShareUrl(doc)}><Mail className="h-4 w-4" /></a></Button>
        {onEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function PfEntryRow({ entry, onEdit, onDelete }: { entry: WorkPfEntry; onEdit: () => void; onDelete: () => void }) {
  const isEstimated = entry.source === "estimated";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${isEstimated ? "bg-emerald-500/5" : "bg-card"}`}>
      <div className="min-w-0">
        <p className="font-medium">{pfMonthDateLabel(entry.month)}</p>
        <p className="text-xs text-muted-foreground">{entry.companyName || "General"} · {isEstimated ? "auto estimated" : entry.source}</p>
        {entry.notes && <p className="mt-1 truncate text-xs text-muted-foreground">{entry.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p className="font-mono font-semibold">{formatCurrency(pfEntryTotal(entry))}</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function WithdrawalRow({ withdrawal, onEdit, onDelete }: { withdrawal: WorkPfWithdrawal; onEdit: () => void; onDelete: () => void }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><div><p className="font-medium">{formatCurrency(withdrawal.amount)}</p><p className="text-xs text-muted-foreground">{withdrawal.companyName || "General"} · {format(parseISO(withdrawal.withdrawalDate), "dd MMM yyyy")}</p>{withdrawal.reason && <p className="mt-1 text-xs text-muted-foreground">{withdrawal.reason}</p>}</div><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div></div>;
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
          <Field label="Salary/PF Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Exit Date"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
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

function FolderDialog({ folder, open, onOpenChange, onSubmit, company }: { folder: WorkDocumentFolder | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; company: WorkCompany | null }) {
  const [form, setForm] = useState({ name: "", color: "#2563eb", icon: "Folder", notes: "" });
  useEffect(() => { if (open) setForm({ name: folder?.name ?? "", color: folder?.color ?? "#2563eb", icon: folder?.icon ?? "Folder", notes: folder?.notes ?? "" }); }, [folder, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{folder ? "Edit Folder" : "Create Folder"}</DialogTitle><DialogDescription>{company ? `Folder for ${company.companyName}` : "Select a company first."}</DialogDescription></DialogHeader>
        <Field label="Folder Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Color"><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field><Field label="Icon"><Select value={form.icon} onValueChange={(value) => setForm({ ...form, icon: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{folderIcons.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent></Select></Field></div>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="flex justify-end"><Button disabled={!company} onClick={() => company && form.name.trim() && onSubmit({ ...form, companyId: company.id, name: form.name.trim(), notes: form.notes || null })}>{folder ? "Save Folder" : "Create Folder"}</Button></div>
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
  const [form, setForm] = useState({ companyId: "", folderId: "", categoryId: "", name: "", documentType: "payslip" as WorkDocumentType, fileName: "", fileUrl: "", documentDate: todayInput(), notes: "" });
  useEffect(() => {
    if (!open) return;
    setForm({ companyId: String(document?.companyId ?? defaultCompanyId ?? ""), folderId: String(document?.folderId ?? defaultFolderId ?? ""), categoryId: String(document?.categoryId ?? ""), name: document?.name ?? "", documentType: document?.documentType ?? "payslip", fileName: document?.fileName ?? "", fileUrl: document?.fileUrl ?? "", documentDate: document?.documentDate ?? todayInput(), notes: document?.notes ?? "" });
  }, [defaultCompanyId, defaultFolderId, document, open]);
  const availableFolders = folders.filter((folder) => !form.companyId || folder.companyId === Number(form.companyId));
  const submit = () => {
    if (!form.name.trim() || !form.companyId || !form.folderId) return;
    onSubmit({ companyId: Number(form.companyId), folderId: Number(form.folderId), categoryId: form.categoryId ? Number(form.categoryId) : null, name: form.name.trim(), documentType: form.documentType, fileName: form.fileName || form.name.trim(), fileUrl: form.fileUrl || null, documentDate: form.documentDate || null, notes: form.notes || null });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{document ? "Edit File" : "Upload File"}</DialogTitle><DialogDescription>Files are saved against a company and can live inside a folder.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value, folderId: "" })}><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Folder"><Select value={form.folderId} onValueChange={(value) => setForm({ ...form, folderId: value })}><SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger><SelectContent>{availableFolders.map((folder) => <SelectItem key={folder.id} value={String(folder.id)}>{folder.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Category"><Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Document Type"><Select value={form.documentType} onValueChange={(value) => setForm({ ...form, documentType: value as WorkDocumentType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{docTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="File Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Document Date"><Input type="date" value={form.documentDate} onChange={(e) => setForm({ ...form, documentDate: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Upload"><Input type="file" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, name: form.name || file.name.replace(/\.[^.]+$/, ""), fileName: file.name, fileUrl: await readFileAsDataUrl(file) }); }} />{form.fileName && <p className="truncate text-xs text-muted-foreground">{form.fileName}</p>}</Field></div>
          <div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
        <div className="flex justify-end"><Button disabled={!form.companyId || !form.folderId || !form.name.trim()} onClick={submit}>{document ? "Save Changes" : "Upload File"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function PfEntryDialog({ entry, open, onOpenChange, onSubmit, companies, defaultCompanyId }: { entry: WorkPfEntry | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; defaultCompanyId: number | null }) {
  const [form, setForm] = useState({ companyId: "", month: monthInput(), employeeAmount: 0, employerAmount: 0, interestAmount: 0, source: "manual" as WorkPfSource, notes: "" });
  useEffect(() => {
    if (!open) return;
    setForm({
      companyId: String(entry?.companyId ?? defaultCompanyId ?? ""),
      month: entry?.month ?? monthInput(),
      employeeAmount: entry?.employeeAmount ?? 0,
      employerAmount: entry?.employerAmount ?? 0,
      interestAmount: entry?.interestAmount ?? 0,
      source: entry?.source === "epfo" ? "epfo" : "manual",
      notes: entry?.source === "estimated" ? "Manual override for generated PF contribution" : entry?.notes ?? "",
    });
  }, [defaultCompanyId, entry, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? entry.id < 0 ? "Override PF Month" : "Edit PF Month" : "Add PF Month"}</DialogTitle>
          <DialogDescription>Record employee, employer, and interest contribution for the 1st of a month.</DialogDescription>
        </DialogHeader>
        <Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}><SelectTrigger><SelectValue placeholder="Optional company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="PF Month"><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>
          <Field label="Employee PF"><Input type="number" value={form.employeeAmount} onChange={(e) => setForm({ ...form, employeeAmount: Number(e.target.value) })} /></Field>
          <Field label="Employer PF"><Input type="number" value={form.employerAmount} onChange={(e) => setForm({ ...form, employerAmount: Number(e.target.value) })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Interest"><Input type="number" value={form.interestAmount} onChange={(e) => setForm({ ...form, interestAmount: Number(e.target.value) })} /></Field>
          <Field label="Source"><Select value={form.source} onValueChange={(value) => setForm({ ...form, source: value as WorkPfSource })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="epfo">EPFO</SelectItem></SelectContent></Select></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="flex justify-end"><Button onClick={() => onSubmit({ ...form, companyId: form.companyId ? Number(form.companyId) : null, notes: form.notes || null })}>Save PF Entry</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalDialog({ withdrawal, open, onOpenChange, onSubmit, companies, defaultCompanyId }: { withdrawal: WorkPfWithdrawal | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; defaultCompanyId: number | null }) {
  const [form, setForm] = useState({ companyId: "", amount: 0, withdrawalDate: todayInput(), reason: "", notes: "" });
  useEffect(() => {
    if (!open) return;
    setForm({
      companyId: String(withdrawal?.companyId ?? defaultCompanyId ?? ""),
      amount: withdrawal?.amount ?? 0,
      withdrawalDate: withdrawal?.withdrawalDate ?? todayInput(),
      reason: withdrawal?.reason ?? "",
      notes: withdrawal?.notes ?? "",
    });
  }, [defaultCompanyId, open, withdrawal]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{withdrawal ? "Edit PF Withdrawal" : "PF Withdrawal"}</DialogTitle><DialogDescription>Record a PF withdrawal so the company and total balances stay accurate.</DialogDescription></DialogHeader><Field label="Company"><Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}><SelectTrigger><SelectValue placeholder="Optional company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field><Field label="Date"><Input type="date" value={form.withdrawalDate} onChange={(e) => setForm({ ...form, withdrawalDate: e.target.value })} /></Field></div><Field label="Reason"><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex justify-end"><Button onClick={() => form.amount > 0 && onSubmit({ ...form, companyId: form.companyId ? Number(form.companyId) : null, reason: form.reason || null, notes: form.notes || null })}>Save Withdrawal</Button></div></DialogContent></Dialog>;
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

function DriveDialog({ open, isPending, onOpenChange, onSubmit, profile }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { email: string }) => void; profile: OneworkProfile | null }) {
  const [email, setEmail] = useState("");
  useEffect(() => { if (open) setEmail(profile?.googleDriveEmail || ""); }, [open, profile]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Google Drive Sync</DialogTitle><DialogDescription>Connect a Drive identity for OneWork document sync metadata.</DialogDescription></DialogHeader>
        <Field label="Google Account"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></Field>
        <div className="flex justify-end"><Button disabled={isPending || !email.includes("@")} onClick={() => onSubmit({ email })}>{isPending ? "Connecting..." : "Connect Drive"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function EpfoSyncDialog({ open, isPending, onOpenChange, onSubmit, profile }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { uan: string; password: string }) => void; profile: OneworkProfile | null }) {
  const [form, setForm] = useState({ uan: "", password: "" });
  useEffect(() => { if (open) setForm({ uan: profile?.uanNumber || "", password: "" }); }, [open, profile]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>EPFO Sync</DialogTitle><DialogDescription>Use UAN credentials to populate company history and PF ledger through the configured backend flow.</DialogDescription></DialogHeader>
        <Field label="UAN / User ID"><Input value={form.uan} onChange={(event) => setForm({ ...form, uan: event.target.value })} /></Field>
        <Field label="Password"><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
        <div className="flex justify-end"><Button disabled={isPending || !form.uan || !form.password} onClick={() => onSubmit(form)}>{isPending ? "Syncing..." : "Sync EPFO"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function PassbookDialog({ open, isPending, onOpenChange, onSubmit }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { passbookText: string }) => void }) {
  const [passbookText, setPassbookText] = useState("");
  useEffect(() => { if (open) setPassbookText(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Parse EPFO Passbook</DialogTitle><DialogDescription>Paste exported passbook text to identify establishments and contribution totals.</DialogDescription></DialogHeader>
        <Field label="Passbook Text"><Textarea className="min-h-48" value={passbookText} onChange={(event) => setPassbookText(event.target.value)} /></Field>
        <div className="flex justify-end"><Button disabled={isPending || passbookText.trim().length < 10} onClick={() => onSubmit({ passbookText })}>{isPending ? "Parsing..." : "Parse Passbook"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function CvImportDialog({ open, isPending, onOpenChange, onSubmit }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { cvText: string; fileName?: string }) => void }) {
  const [form, setForm] = useState({ cvText: "", fileName: "" });
  useEffect(() => { if (open) setForm({ cvText: "", fileName: "" }); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Parse CV</DialogTitle><DialogDescription>Upload or paste CV text to create editable company timeline records.</DialogDescription></DialogHeader>
        <Field label="CV File"><Input type="file" accept=".txt,.pdf,.doc,.docx" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const text = file.type.startsWith("text/") || file.name.endsWith(".txt") ? await file.text() : "";
          setForm({ cvText: text, fileName: file.name });
        }} /></Field>
        <Field label="CV Text"><Textarea className="min-h-48" value={form.cvText} onChange={(event) => setForm({ ...form, cvText: event.target.value })} placeholder="Paste resume text here when uploading PDF/DOCX is not readable in-browser." /></Field>
        <div className="flex justify-end"><Button disabled={isPending || (!form.cvText.trim() && !form.fileName)} onClick={() => onSubmit(form)}>{isPending ? "Importing..." : "Import Timeline"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function SalaryUploadDialog({ open, isPending, onOpenChange, onSubmit, companies, defaultCompanyId }: { open: boolean; isPending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; companies: WorkCompany[]; defaultCompanyId: number | null }) {
  const [form, setForm] = useState({
    companyId: "",
    documentType: "payslip" as WorkDocumentType,
    fileName: "",
    fileUrl: "",
    documentDate: todayInput(),
    rawText: "",
    netSalary: "",
    grossSalary: "",
    ctcAnnual: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        companyId: String(defaultCompanyId ?? companies[0]?.id ?? ""),
        documentType: "payslip",
        fileName: "",
        fileUrl: "",
        documentDate: todayInput(),
        rawText: "",
        netSalary: "",
        grossSalary: "",
        ctcAnnual: "",
        notes: "",
      });
    }
  }, [companies, defaultCompanyId, open]);

  const submit = () => {
    if (!form.companyId || !form.fileName) return;
    onSubmit({
      companyId: Number(form.companyId),
      documentType: form.documentType,
      fileName: form.fileName,
      fileUrl: form.fileUrl || null,
      documentDate: form.documentDate || null,
      rawText: form.rawText,
      netSalary: form.netSalary ? Number(form.netSalary) : undefined,
      grossSalary: form.grossSalary ? Number(form.grossSalary) : undefined,
      ctcAnnual: form.ctcAnnual ? Number(form.ctcAnnual) : undefined,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Salary Document</DialogTitle>
          <DialogDescription>Upload a payslip, offer letter, or hike letter and save parsed salary details to the selected company.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <Select value={form.companyId} onValueChange={(value) => setForm({ ...form, companyId: value })}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>{companies.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.companyName}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Document Type">
            <Select value={form.documentType} onValueChange={(value) => setForm({ ...form, documentType: value as WorkDocumentType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="payslip">Payslip</SelectItem>
                <SelectItem value="offer_letter">Offer letter</SelectItem>
                <SelectItem value="hike_letter">Hike letter</SelectItem>
                <SelectItem value="form16">Form 16</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Document Date"><Input type="date" value={form.documentDate} onChange={(event) => setForm({ ...form, documentDate: event.target.value })} /></Field>
          <Field label="File">
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const text = file.type.startsWith("text/") || file.name.endsWith(".txt") ? await file.text() : form.rawText;
              setForm({ ...form, fileName: file.name, fileUrl: await readFileAsDataUrl(file), rawText: text });
            }} />
            {form.fileName && <p className="truncate text-xs text-muted-foreground">{form.fileName}</p>}
          </Field>
          <Field label="Net / In-hand Salary"><Input type="number" value={form.netSalary} onChange={(event) => setForm({ ...form, netSalary: event.target.value })} placeholder="Parsed or enter manually" /></Field>
          <Field label="Gross Salary"><Input type="number" value={form.grossSalary} onChange={(event) => setForm({ ...form, grossSalary: event.target.value })} placeholder="Parsed or enter manually" /></Field>
          <Field label="Annual CTC / Package"><Input type="number" value={form.ctcAnnual} onChange={(event) => setForm({ ...form, ctcAnnual: event.target.value })} placeholder="Offer/hike CTC" /></Field>
          <Field label="Notes"><Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Salary Text">
              <Textarea className="min-h-32" value={form.rawText} onChange={(event) => setForm({ ...form, rawText: event.target.value })} placeholder="Paste payslip text when PDF/DOCX text is not readable in-browser." />
            </Field>
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled={isPending || !form.companyId || !form.fileName} onClick={submit}>{isPending ? "Saving..." : "Save and Parse"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
