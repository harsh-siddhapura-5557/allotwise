"use client";

import { useEffect, useState } from "react";
import { formatDate, exportToCSV } from "@/lib/utils";
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  CreditCard,
} from "lucide-react";

interface UPI {
  id: string;
  upiId: string;
  memberId: string | null;
  createdAt: string;
  member: { fullName: string; panNumber: string } | null;
}

interface Member {
  id: string;
  fullName: string;
  panNumber: string;
}

export default function UPIPage() {
  const [upis, setUpis] = useState<UPI[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UPI | null>(null);
  const [form, setForm] = useState({ memberId: "", upiId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/upi").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ])
      .then(([u, m]) => {
        setUpis(u);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = upis.filter(
    (u) =>
      u.upiId.toLowerCase().includes(search.toLowerCase()) ||
      (u.member &&
        u.member.fullName.toLowerCase().includes(search.toLowerCase())),
  );

  function openAdd() {
    setEditing(null);
    setForm({ memberId: "", upiId: "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: UPI) {
    setEditing(u);
    setForm({ memberId: u.memberId || "", upiId: u.upiId });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/upi/${editing.id}` : "/api/upi";
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

  async function handleDelete(u: UPI) {
    if (!confirm(`Delete UPI ID "${u.upiId}"?`)) return;
    const res = await fetch(`/api/upi/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Failed to delete");
      return;
    }
    load();
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UPI IDs</h1>
          <p className="text-sm text-muted-foreground">{upis.length} UPI IDs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToCSV(
                filtered.map((u) => ({
                  UPI: u.upiId,
                  Member: u.member?.fullName || "Not Assigned",
                  PAN: u.member?.panNumber || "-",
                  Added: formatDate(u.createdAt),
                })),
                "upis",
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
            Add UPI
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search UPI ID or member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-head">#</th>
                <th className="table-head">UPI ID</th>
                <th className="table-head">Member</th>
                <th className="table-head">PAN Number</th>
                <th className="table-head">Added On</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No UPI IDs found</p>
                    <button
                      onClick={openAdd}
                      className="mt-2 text-blue-600 text-sm hover:underline"
                    >
                      Add first UPI ID
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="table-cell text-muted-foreground text-xs">
                      {i + 1}
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded">
                        {u.upiId}
                      </span>
                    </td>
                    <td className="table-cell">
                      {u.member ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-semibold">
                            {u.member.fullName.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">
                            {u.member.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="table-cell font-mono text-sm text-muted-foreground">
                      {u.member?.panNumber || "-"}
                    </td>
                    <td className="table-cell text-muted-foreground text-sm">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit UPI ID" : "Add UPI ID"}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Member (Optional)
                </label>
                <select
                  value={form.memberId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, memberId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not assigned to any member</option>
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
                <input
                  required
                  value={form.upiId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      upiId: e.target.value.toLowerCase(),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="name@upi"
                />
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
                  {saving ? "Saving..." : editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
