"use client";

import { useEffect, useState, useCallback } from "react";
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  getIPOTypeColor,
  exportToCSV,
  cn,
} from "@/lib/utils";
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Application {
  id: string;
  appliedAmount: number;
  lotQuantity: number;
  applicationDate: string;
  status: string;
  ipo: { name: string; ipoType: string; issuePrice: number; lotSize: number };
  member: { fullName: string; panNumber: string };
  upiId: { upiId: string };
  allotment?: {
    sharesAllotted: number;
    issuePrice: number;
    listingPrice?: number;
    sellPrice?: number;
    profit?: number;
    loss?: number;
  };
}

interface IPO {
  id: string;
  name: string;
  ipoType: string;
  issuePrice: number;
  lotSize: number;
}
interface Member {
  id: string;
  fullName: string;
  panNumber: string;
}
interface UPIId {
  id: string;
  upiId: string;
  memberId: string | null;
}

const STATUSES = ["APPLIED", "ALLOTTED", "NOT_ALLOTTED", "REFUNDED", "SOLD"];

export default function ApplicationsPage() {
  const [data, setData] = useState<{
    applications: Application[];
    total: number;
  }>({ applications: [], total: 0 });
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [upis, setUpis] = useState<UPIId[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [ipoFilter, setIpoFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [allotApp, setAllotApp] = useState<Application | null>(null);
  const [form, setForm] = useState({
    ipoId: "",
    memberId: "",
    upiIdId: "",
    appliedAmount: "",
    lotQuantity: "1",
    applicationDate: new Date().toISOString().split("T")[0],
    status: "APPLIED",
  });
  const [allotForm, setAllotForm] = useState({
    sharesAllotted: "",
    issuePrice: "",
    listingPrice: "",
    sellPrice: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // All UPI IDs are usable for all members now!
  const memberUpis = upis;

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (statusFilter) q.set("status", statusFilter);
    if (memberFilter) q.set("memberId", memberFilter);
    if (ipoFilter) q.set("ipoId", ipoFilter);
    q.set("page", String(page));
    q.set("limit", "15");
    fetch(`/api/applications?${q}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, statusFilter, memberFilter, ipoFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ipos").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/upi").then((r) => r.json()),
    ]).then(([i, m, u]) => {
      setIpos(i);
      setMembers(m);
      setUpis(u);
    });
  }, []);

  // Auto-calc applied amount when IPO/qty changes
  useEffect(() => {
    const ipo = ipos.find((i) => i.id === form.ipoId);
    if (ipo && form.lotQuantity) {
      setForm((f) => ({
        ...f,
        appliedAmount: String(
          ipo.issuePrice * ipo.lotSize * parseInt(f.lotQuantity),
        ),
      }));
    }
  }, [form.ipoId, form.lotQuantity, ipos]);

  function openAdd() {
    setEditing(null);
    setForm({
      ipoId: "",
      memberId: "",
      upiIdId: "",
      appliedAmount: "",
      lotQuantity: "1",
      applicationDate: new Date().toISOString().split("T")[0],
      status: "APPLIED",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(app: Application) {
    setEditing(app);
    // Find upiId by upiId.upiId (since we don't have upiId.id in app)
    const upi = upis.find((u) => u.upiId === app.upiId.upiId);
    setForm({
      ipoId: "",
      memberId: "",
      upiIdId: upi?.id || "",
      appliedAmount: String(app.appliedAmount),
      lotQuantity: String(app.lotQuantity),
      applicationDate: new Date(app.applicationDate)
        .toISOString()
        .split("T")[0],
      status: app.status,
    });
    setError("");
    setShowModal(true);
  }

  function openAllot(app: Application) {
    setAllotApp(app);
    setAllotForm({
      sharesAllotted: String(app.allotment?.sharesAllotted || app.ipo.lotSize),
      issuePrice: String(app.allotment?.issuePrice || app.ipo.issuePrice),
      listingPrice: String(app.allotment?.listingPrice || ""),
      sellPrice: String(app.allotment?.sellPrice || ""),
    });
    setShowAllotModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing
        ? `/api/applications/${editing.id}`
        : "/api/applications";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAllotSave(e: React.FormEvent) {
    e.preventDefault();
    if (!allotApp) return;
    setSaving(true);
    try {
      await fetch("/api/allotments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: allotApp.id, ...allotForm }),
      });
      setShowAllotModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(app: Application) {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
    load();
  }

  const totalPages = Math.ceil(data.total / 15);

  const allotProfit =
    allotForm.sellPrice && allotForm.issuePrice && allotForm.sharesAllotted
      ? (parseFloat(allotForm.sellPrice) - parseFloat(allotForm.issuePrice)) *
        parseInt(allotForm.sharesAllotted)
      : null;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {data.total} total applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToCSV(
                data.applications.map((a) => ({
                  IPO: a.ipo.name,
                  Type: a.ipo.ipoType,
                  Member: a.member.fullName,
                  PAN: a.member.panNumber,
                  UPI: a.upiId.upiId,
                  Amount: a.appliedAmount,
                  Lots: a.lotQuantity,
                  Date: formatDate(a.applicationDate),
                  Status: a.status,
                })),
                "applications",
              )
            }
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={(e) => {
            setMemberFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
        <select
          value={ipoFilter}
          onChange={(e) => {
            setIpoFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All IPOs</option>
          {ipos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-head">#</th>
                <th className="table-head">IPO</th>
                <th className="table-head">Member</th>
                <th className="table-head">UPI ID</th>
                <th className="table-head">Lots</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Date</th>
                <th className="table-head">Status</th>
                <th className="table-head">P&L</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No applications found
                    </p>
                    <button
                      onClick={openAdd}
                      className="mt-2 text-blue-600 text-sm hover:underline"
                    >
                      Add first application
                    </button>
                  </td>
                </tr>
              ) : (
                data.applications.map((app, i) => (
                  <tr
                    key={app.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="table-cell text-muted-foreground text-xs">
                      {(page - 1) * 15 + i + 1}
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm text-foreground whitespace-nowrap">
                          {app.ipo.name}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            getIPOTypeColor(app.ipo.ipoType),
                          )}
                        >
                          {app.ipo.ipoType}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {app.member.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {app.member.panNumber}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                        {app.upiId.upiId}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-center">
                      {app.lotQuantity}
                    </td>
                    <td className="table-cell text-sm font-medium">
                      {formatCurrency(app.appliedAmount)}
                    </td>
                    <td className="table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(app.applicationDate)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                          getStatusColor(app.status),
                        )}
                      >
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {app.allotment?.profit != null &&
                        app.allotment.profit > 0 && (
                          <span className="profit-text text-xs">
                            +{formatCurrency(app.allotment.profit)}
                          </span>
                        )}
                      {app.allotment?.loss != null &&
                        app.allotment.loss > 0 && (
                          <span className="loss-text text-xs">
                            -{formatCurrency(app.allotment.loss)}
                          </span>
                        )}
                      {!app.allotment?.profit && !app.allotment?.loss && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {["ALLOTTED", "SOLD"].includes(app.status) && (
                          <button
                            onClick={() => openAllot(app)}
                            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 transition-colors whitespace-nowrap"
                          >
                            {app.allotment ? "Edit Allot" : "Allot"}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(app)}
                          className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(app)}
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of{" "}
              {data.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-8 h-8 rounded-md text-sm transition-colors",
                      p === page ? "bg-blue-600 text-white" : "hover:bg-accent",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Application" : "Add Application"}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">IPO *</label>
                <select
                  required
                  value={form.ipoId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ipoId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select IPO...</option>
                  {ipos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.ipoType}) — ₹{i.issuePrice}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Member *
                </label>
                <select
                  required
                  value={form.memberId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      memberId: e.target.value,
                      upiIdId: "",
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.panNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  UPI ID *
                </label>
                <select
                  required
                  value={form.upiIdId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, upiIdId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select UPI...</option>
                  {memberUpis.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.upiId}
                    </option>
                  ))}
                </select>
                {memberUpis.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No UPI IDs yet. Add from UPI page.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lot Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.lotQuantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lotQuantity: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Applied Amount (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.appliedAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, appliedAmount: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={form.applicationDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        applicationDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {getStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update"
                      : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allotment Modal */}
      {showAllotModal && allotApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAllotModal(false)}
          />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Allotment Details</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {allotApp.ipo.name} — {allotApp.member.fullName}
            </p>
            <form onSubmit={handleAllotSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Shares Allotted *
                  </label>
                  <input
                    required
                    type="number"
                    value={allotForm.sharesAllotted}
                    onChange={(e) =>
                      setAllotForm((f) => ({
                        ...f,
                        sharesAllotted: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Issue Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={allotForm.issuePrice}
                    onChange={(e) =>
                      setAllotForm((f) => ({
                        ...f,
                        issuePrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Listing Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={allotForm.listingPrice}
                    onChange={(e) =>
                      setAllotForm((f) => ({
                        ...f,
                        listingPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="On listing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sell Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={allotForm.sellPrice}
                    onChange={(e) =>
                      setAllotForm((f) => ({ ...f, sellPrice: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Actual sell"
                  />
                </div>
              </div>

              {allotProfit !== null && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm font-medium",
                    allotProfit >= 0
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                  )}
                >
                  {allotProfit >= 0 ? "Estimated Profit:" : "Estimated Loss:"}{" "}
                  <strong>{formatCurrency(Math.abs(allotProfit))}</strong>
                  <p className="text-xs opacity-75 mt-0.5">
                    Formula: (Sell - Issue) × Shares = ({allotForm.sellPrice} -{" "}
                    {allotForm.issuePrice}) × {allotForm.sharesAllotted}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllotModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Save Allotment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
