"use client";

import { useEffect, useState } from "react";
import {
  formatDate,
  formatCurrency,
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
  TrendingUp,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface IPO {
  id: string;
  name: string;
  ipoType: string;
  issuePrice: number;
  lotSize: number;
  openDate: string;
  closeDate: string;
  status: string;
  _count: { applications: number };
}

interface MarketIPO {
  source: string;
  type: "current" | "upcoming";
  symbol: string;
  name: string;
  ipoType: string;
  status: string;
  issuePrice: number;
  lotSize: number;
  openDate: string | Date;
  closeDate: string | Date;
  alreadyAdded: boolean;
  subscription?: {
    noOfSharesOffered: string;
    noOfSharesBid: string;
    timesSubscribed: string;
  };
  issueSize?: string;
}

const emptyForm = {
  name: "",
  ipoType: "MAINBOARD",
  issuePrice: "",
  lotSize: "",
  openDate: "",
  closeDate: "",
  status: "UPCOMING",
};

const statusColors: Record<string, string> = {
  UPCOMING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  OPEN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  LISTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function IPOsPage() {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [marketIpos, setMarketIpos] = useState<MarketIPO[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "market">("my");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IPO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  function load() {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (typeFilter) q.set("type", typeFilter);
    if (statusFilter) q.set("status", statusFilter);
    fetch(`/api/ipos?${q}`)
      .then((r) => r.json())
      .then(setIpos)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [search, typeFilter, statusFilter]);

  function toDateInput(d: string) {
    return d ? new Date(d).toISOString().split("T")[0] : "";
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(ipo: IPO) {
    setEditing(ipo);
    setForm({
      name: ipo.name,
      ipoType: ipo.ipoType,
      issuePrice: String(ipo.issuePrice),
      lotSize: String(ipo.lotSize),
      openDate: toDateInput(ipo.openDate),
      closeDate: toDateInput(ipo.closeDate),
      status: ipo.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/ipos/${editing.id}` : "/api/ipos";
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

  async function handleDelete(ipo: IPO) {
    if (!confirm(`Delete "${ipo.name}"?`)) return;
    const res = await fetch(`/api/ipos/${ipo.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Failed to delete");
      return;
    }
    load();
  }

  async function handleImportFromNSE() {
    if (!confirm("Import all current and upcoming IPOs from NSE?")) return;
    setImporting(true);
    try {
      const res = await fetch("/api/ipos/import-nse", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Successfully imported ${data.imported} IPO(s)!`);
      load();
      // Refresh market IPOs too
      if (activeTab === "market") loadMarketIpos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function loadMarketIpos() {
    setMarketLoading(true);
    try {
      const res = await fetch("/api/ipos/market");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMarketIpos(data.ipos);
    } catch (err) {
      console.error(err);
      alert("Failed to load market IPOs");
    } finally {
      setMarketLoading(false);
    }
  }

  async function addSingleIpo(ipo: MarketIPO) {
    try {
      const res = await fetch("/api/ipos/import-nse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: ipo.symbol,
          series: ipo.ipoType === "SME" ? "SME" : "EQ",
          companyName: ipo.name,
          type: ipo.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Successfully added ${ipo.name}!`);
      load();
      // Refresh market IPOs
      loadMarketIpos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add IPO");
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">IPO Master</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "my"
              ? `${ipos.length} IPOs tracked`
              : "Browse all NSE IPOs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "my" && (
            <button
              onClick={() =>
                exportToCSV(
                  ipos.map((i) => ({
                    Name: i.name,
                    Type: i.ipoType,
                    Price: i.issuePrice,
                    LotSize: i.lotSize,
                    Open: formatDate(i.openDate),
                    Close: formatDate(i.closeDate),
                    Status: i.status,
                    Applications: i._count.applications,
                  })),
                  "ipos",
                )
              }
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            onClick={handleImportFromNSE}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn("w-4 h-4", importing && "animate-spin")} />
            <span className="hidden sm:inline">Import All</span>
          </button>
          {activeTab === "market" && (
            <button
              onClick={loadMarketIpos}
              disabled={marketLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={cn("w-4 h-4", marketLoading && "animate-spin")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          {activeTab === "my" && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add IPO
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === "my"
              ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          My IPOs
        </button>
        <button
          onClick={() => {
            setActiveTab("market");
            if (marketIpos.length === 0) loadMarketIpos();
          }}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === "market"
              ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Market IPOs
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search IPOs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="MAINBOARD">Mainboard</option>
          <option value="SME">SME</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="LISTED">Listed</option>
        </select>
      </div>

      {activeTab === "my" && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-head">#</th>
                  <th className="table-head">IPO Name</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Issue Price</th>
                  <th className="table-head">Lot Size</th>
                  <th className="table-head">Lot Value</th>
                  <th className="table-head">Open Date</th>
                  <th className="table-head">Close Date</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Apps</th>
                  <th className="table-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(11)].map((_, j) => (
                        <td key={j} className="table-cell">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : ipos.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center">
                      <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No IPOs found</p>
                      <button
                        onClick={openAdd}
                        className="mt-2 text-blue-600 text-sm hover:underline"
                      >
                        Add first IPO
                      </button>
                    </td>
                  </tr>
                ) : (
                  ipos.map((ipo, i) => (
                    <tr
                      key={ipo.id}
                      className="hover:bg-accent/30 transition-colors"
                    >
                      <td className="table-cell text-muted-foreground text-xs">
                        {i + 1}
                      </td>
                      <td className="table-cell font-medium text-foreground whitespace-nowrap">
                        {ipo.name}
                      </td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            getIPOTypeColor(ipo.ipoType),
                          )}
                        >
                          {ipo.ipoType}
                        </span>
                      </td>
                      <td className="table-cell font-mono text-sm">
                        {formatCurrency(ipo.issuePrice)}
                      </td>
                      <td className="table-cell text-sm">
                        {ipo.lotSize} shares
                      </td>
                      <td className="table-cell text-sm font-medium">
                        {formatCurrency(ipo.issuePrice * ipo.lotSize)}
                      </td>
                      <td className="table-cell text-sm text-muted-foreground">
                        {formatDate(ipo.openDate)}
                      </td>
                      <td className="table-cell text-sm text-muted-foreground">
                        {formatDate(ipo.closeDate)}
                      </td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            statusColors[ipo.status],
                          )}
                        >
                          {ipo.status}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-center">
                        {ipo._count.applications}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(ipo)}
                            className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ipo)}
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
        </div>
      )}

      {activeTab === "market" && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-head">#</th>
                  <th className="table-head">IPO Name</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Issue Price</th>
                  <th className="table-head">Lot Size</th>
                  <th className="table-head">Open Date</th>
                  <th className="table-head">Close Date</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Action</th>
                </tr>
              </thead>
              <tbody>
                {marketLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="table-cell">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : marketIpos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No IPOs found in market
                      </p>
                      <button
                        onClick={loadMarketIpos}
                        className="mt-2 text-blue-600 text-sm hover:underline"
                      >
                        Refresh
                      </button>
                    </td>
                  </tr>
                ) : (
                  marketIpos.map((ipo, i) => (
                    <tr
                      key={`${ipo.symbol}-${i}`}
                      className="hover:bg-accent/30 transition-colors"
                    >
                      <td className="table-cell text-muted-foreground text-xs">
                        {i + 1}
                      </td>
                      <td className="table-cell font-medium text-foreground whitespace-nowrap">
                        {ipo.name}
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {ipo.symbol}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            getIPOTypeColor(ipo.ipoType),
                          )}
                        >
                          {ipo.ipoType}
                        </span>
                      </td>
                      <td className="table-cell font-mono text-sm">
                        {formatCurrency(ipo.issuePrice)}
                      </td>
                      <td className="table-cell text-sm">
                        {ipo.lotSize} shares
                      </td>
                      <td className="table-cell text-sm text-muted-foreground">
                        {formatDate(ipo.openDate)}
                      </td>
                      <td className="table-cell text-sm text-muted-foreground">
                        {formatDate(ipo.closeDate)}
                      </td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            statusColors[ipo.status],
                          )}
                        >
                          {ipo.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        {ipo.alreadyAdded ? (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Added
                          </div>
                        ) : (
                          <button
                            onClick={() => addSingleIpo(ipo)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit IPO" : "Add IPO"}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  IPO Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tata Technologies"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    IPO Type *
                  </label>
                  <select
                    required
                    value={form.ipoType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ipoType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MAINBOARD">Mainboard</option>
                    <option value="SME">SME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                    <option value="LISTED">Listed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Issue Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.issuePrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issuePrice: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lot Size (shares) *
                  </label>
                  <input
                    required
                    type="number"
                    value={form.lotSize}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lotSize: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Open Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.openDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Close Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.closeDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, closeDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {form.issuePrice && form.lotSize && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                  Lot value:{" "}
                  <strong>
                    {formatCurrency(
                      parseFloat(form.issuePrice) * parseInt(form.lotSize),
                    )}
                  </strong>
                </div>
              )}
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
                  {saving ? "Saving..." : editing ? "Update" : "Add IPO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
