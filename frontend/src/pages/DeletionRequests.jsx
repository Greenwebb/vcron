import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";

const STATUS_TABS = [
  { value: "pending",  label: "Pending",  color: "text-amber-800",  bg: "bg-amber-100 border-amber-200" },
  { value: "approved", label: "Approved", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" },
  { value: "rejected", label: "Rejected", color: "text-slate-400",  bg: "bg-slate-500/10 border-slate-500/30" },
  { value: "all",      label: "All",      color: "text-slate-600",  bg: "bg-slate-200/30 border-slate-600/30" },
];

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: "Pending",  cls: "bg-amber-900/40 text-amber-300 border-amber-700/40" },
    approved: { label: "Approved", cls: "bg-red-900/40 text-red-300 border-red-700/40" },
    rejected: { label: "Rejected", cls: "bg-slate-100 text-slate-400 border-slate-200" },
  };
  const s = map[status] || map.pending;
  return <Badge className={`${s.cls} border text-xs capitalize`}>{s.label}</Badge>;
};

// ─── Reject modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ request, onClose, onRejected }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API}/admin/deletion-requests/${request.request_id}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to reject");
      }
      toast.success(`Request from ${request.user_name} rejected.`);
      onRejected(request.request_id);
    } catch (e) {
      toast.error(e.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Reject Deletion Request</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rejecting request from <strong className="text-slate-700">{request.user_name}</strong>
          </p>
        </div>
        <div className="p-5">
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Reason for rejection (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Request does not meet policy requirements…"
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
          />
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-200">
          <Button
            variant="outline"
            className="flex-1 border-slate-200 text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-700 hover:bg-red-800 text-white"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
            Reject Request
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm approve modal ────────────────────────────────────────────────────
const ApproveModal = ({ request, onClose, onApproved }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API}/admin/deletion-requests/${request.request_id}/approve`,
        { method: "PUT" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to approve");
      }
      toast.success(`Account for ${request.user_name} has been deleted.`);
      onApproved(request.request_id);
    } catch (e) {
      toast.error(e.message || "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-red-900/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Confirm Account Deletion</h2>
              <p className="text-xs text-slate-400 mt-0.5">This action is irreversible</p>
            </div>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 mb-4 text-sm text-slate-600">
            <p>You are about to permanently delete the account of:</p>
            <p className="font-semibold text-slate-900 mt-1">{request.user_name}</p>
            <p className="text-slate-400 text-xs">{request.user_email}</p>
            {request.reason && (
              <p className="text-slate-400 text-xs mt-2 italic">Reason: "{request.reason}"</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            The account will be deactivated and the user will no longer be able to log in.
            Attendance records will be retained for audit purposes.
          </p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button
            variant="outline"
            className="flex-1 border-slate-200 text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-700 hover:bg-red-800 text-white"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const DeletionRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("pending");
  const [page, setPage]             = useState(1);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API}/admin/deletion-requests?status=${activeTab}&page=${page}&limit=20`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApproved = (request_id) => {
    setRequests((prev) => prev.filter((r) => r.request_id !== request_id));
    setTotal((t) => Math.max(0, t - 1));
    setApproveTarget(null);
  };

  const handleRejected = (request_id) => {
    setRequests((prev) => prev.filter((r) => r.request_id !== request_id));
    setTotal((t) => Math.max(0, t - 1));
    setRejectTarget(null);
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-900"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <Logo variant="light" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Deletion Requests</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-900"
            onClick={fetchRequests}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeTab === tab.value
                  ? `${tab.bg} ${tab.color}`
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.value && total > 0 && (
                <span className="ml-1.5 opacity-70">({total})</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-500" />
            <p className="font-medium">No {activeTab === "all" ? "" : activeTab} requests</p>
            <p className="text-xs mt-1 opacity-60">
              {activeTab === "pending" ? "All caught up — no pending deletion requests." : "Nothing to show here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.request_id} className="bg-white border-slate-200">
                <CardContent className="pt-4 pb-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-red-900/30 border border-red-800/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 text-sm">{req.user_name}</p>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{req.user_email}</p>

                        {/* Reason */}
                        {req.reason && (
                          <div className="flex items-start gap-1.5 mt-2">
                            <MessageSquare className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-400 italic">"{req.reason}"</p>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>Requested: {formatDate(req.created_at)}</span>
                          </div>
                          {req.reviewed_at && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>Reviewed: {formatDate(req.reviewed_at)} by {req.reviewer_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions — only for pending */}
                    {req.status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
                          onClick={() => setRejectTarget(req)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 hover:bg-red-800 text-white text-xs"
                          onClick={() => setApproveTarget(req)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-400 hover:text-slate-900"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-400 hover:text-slate-900"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={handleApproved}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
};

export default DeletionRequests;
