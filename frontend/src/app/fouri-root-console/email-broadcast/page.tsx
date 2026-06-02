"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Send, Loader2, Search, Trash2, Eye, ChevronDown,
} from "lucide-react";

const RECIPIENT_TYPES = [
  { value: "ALL", label: "All Users" },
  { value: "FREE", label: "Free Users" },
  { value: "PREMIUM", label: "Premium Users" },
  { value: "ACTIVE", label: "Active Users" },
  { value: "INACTIVE", label: "Inactive Users" },
  { value: "SELECTED", label: "Selected Users" },
  { value: "CUSTOM", label: "Custom Email List" },
];

const TONE_OPTIONS = [
  "Professional", "Marketing", "Promotional", "Educational",
  "Announcement", "Newsletter", "Event Invitation", "Product Update",
];

export default function EmailBroadcastPage() {
  const api = useOwnerApi();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Compose form
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ delivered: number; failed: number; total: number; error?: string } | null>(null);

  // Variable picker
  const AVAILABLE_VARIABLES = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "fullName", label: "Full Name" },
    { key: "name", label: "Name (alias for fullName)" },
    { key: "email", label: "Email" },
    { key: "username", label: "Username" },
    { key: "membershipType", label: "Membership Type" },
    { key: "registrationDate", label: "Registration Date" },
    { key: "currentDate", label: "Current Date" },
    { key: "appUrl", label: "App URL (auto: localhost or fouri.in)" },
  ];
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [varPickerOpen, setVarPickerOpen] = useState<"subject" | "body" | null>(null);

  const insertVariable = (target: "subject" | "body", vkey: string) => {
    const tag = `{{${vkey}}}`;
    if (target === "subject") {
      const el = subjectInputRef.current;
      if (el) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const val = subject;
        setSubject(val.slice(0, start) + tag + val.slice(end));
        requestAnimationFrame(() => {
          const pos = start + tag.length;
          el.setSelectionRange(pos, pos);
          el.focus();
        });
      } else {
        setSubject((prev) => prev + tag);
      }
    } else {
      const el = bodyTextareaRef.current;
      if (el) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const val = body;
        setBody(val.slice(0, start) + tag + val.slice(end));
        requestAnimationFrame(() => {
          const pos = start + tag.length;
          el.setSelectionRange(pos, pos);
          el.focus();
        });
      } else {
        setBody((prev) => prev + tag);
      }
    }
    setVarPickerOpen(null);
  };

  // Preview As User
  const [previewUserId, setPreviewUserId] = useState("");
  const [previewResult, setPreviewResult] = useState<{ renderedSubject: string; renderedBody: string; user: { name: string; email: string } } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [userListOpen, setUserListOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    // Fetch a reasonable number of users for preview picker
    api("/owner/users?limit=50").then((r) => setUserList(r.users || [])).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close variable picker on click outside
  useEffect(() => {
    const handler = () => setVarPickerOpen(null);
    if (varPickerOpen) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [varPickerOpen]);

  // AI assistant
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiTone, setAiTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const [campaignsRes, templatesRes] = await Promise.all([
          api("/owner/email/history"),
          api("/owner/email/templates"),
        ]);
        setCampaigns(campaignsRes.campaigns || []);
        setTemplates(templatesRes.templates || []);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); return; }
    try {
      const res = await api(`/owner/users?search=${encodeURIComponent(q)}&limit=20`);
      setUsers(res.users || []);
    } catch {
      setUsers([]);
    }
  }, [api]);

  const toggleUser = (uid: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const loadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((t: any) => t.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  const generateWithAi = async () => {
    if (!aiInstructions.trim()) return;
    setGenerating(true);
    try {
      const res = await api("/owner/email/generate-ai", {
        method: "POST",
        body: JSON.stringify({ instructions: aiInstructions, tone: aiTone }),
      });
      setSubject(res.subject || "");
      setBody(res.body || "");
    } catch {
      // handle error
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setResult(null);
    try {
      const payload: any = {
        subject: subject.trim(),
        body,
        recipientType,
        templateId: selectedTemplateId || undefined,
      };
      if (recipientType === "SELECTED") {
        payload.userIds = selectedUserIds;
        console.log("[Email Debug] Selected users:", selectedUserIds.length, selectedUserIds);
      }
      if (recipientType === "CUSTOM") {
        payload.customEmails = customEmails.split(",").map((e) => e.trim()).filter(Boolean);
        console.log("[Email Debug] Custom emails:", payload.customEmails);
      }

      console.log("[Email Debug] Sending payload:", { ...payload, body: payload.body?.substring(0, 100) + "..." });
      const res = await api("/owner/email/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[Email Debug] Response:", res);
      // Use the smtpError from the backend response if available
      const errorDetail = res.smtpError || (res.errors && res.errors.length > 0 ? res.errors.join("; ") : undefined);
      setResult({ delivered: res.delivered, failed: res.failed, total: res.total, error: errorDetail });

      // Refresh history
      const campaignsRes = await api("/owner/email/history");
      setCampaigns(campaignsRes.campaigns || []);
    } catch (err: any) {
      console.error("[Email Debug] Send failed:", err);
      const message = err?.error || err?.message || "Email delivery failed. Please check SMTP settings and try again.";
      setResult({ delivered: 0, failed: 0, total: selectedUserIds.length || 0, error: message });
    } finally {
      setSending(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await api(`/owner/email/history/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5f7]">Email Broadcast</h1>
        <p className="text-sm text-[#888899] mt-1">Send emails to users or manage campaigns.</p>
      </div>

      {/* Compose */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-sm font-semibold text-[#f5f5f7]">Compose Email</h2>

        {/* Template selector */}
        {templates.length > 0 && (
          <div>
            <label className="block text-xs text-[#888899] mb-1.5">Load Template</label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => loadTemplate(e.target.value)}
                className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="">-- Select template --</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[#888899]">Subject</label>
            <div className="relative">
              <button
                onClick={() => setVarPickerOpen(varPickerOpen === "subject" ? null : "subject")}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <ChevronDown size={12} /> Insert Variable
              </button>
              {varPickerOpen === "subject" && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a28] border border-white/10 rounded-xl py-1 min-w-[160px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable("subject", v.key)}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#f5f5f7] hover:bg-white/5 cursor-pointer"
                    >
                      {v.label} <span className="text-[#555566] ml-1">{`{{${v.key}}}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <input
            ref={subjectInputRef}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[#888899]">Body (HTML)</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setVarPickerOpen(varPickerOpen === "body" ? null : "body")}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  <ChevronDown size={12} /> Insert Variable
                </button>
                {varPickerOpen === "body" && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a28] border border-white/10 rounded-xl py-1 min-w-[160px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                    {AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => insertVariable("body", v.key)}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#f5f5f7] hover:bg-white/5 cursor-pointer"
                      >
                        {v.label} <span className="text-[#555566] ml-1">{`{{${v.key}}}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Eye size={12} />
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>
          {showPreview ? (
            <div
              className="bg-white rounded-xl p-4 min-h-[200px] text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <textarea
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="<p>Email body HTML...</p>"
              rows={8}
              className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] font-mono outline-none focus:border-blue-500/50 resize-y"
            />
          )}
        </div>

        {/* AI Assistant */}
        <div className="border-t border-white/5 pt-4">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">AI Email Assistant</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="Write an email announcing..."
              className="flex-1 bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
              </div>
              <button
                onClick={generateWithAi}
                disabled={generating || !aiInstructions.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recipient Targeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-[#f5f5f7]">Recipients</h2>

        <div className="flex flex-wrap gap-2">
          {RECIPIENT_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setRecipientType(rt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                recipientType === rt.value
                  ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                  : "bg-white/5 text-[#888899] border border-white/5 hover:text-[#f5f5f7]"
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>

        {recipientType === "SELECTED" && (
          <div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888899]" />
              <input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search users by name or email..."
                className="w-full bg-[#08080f] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {users.map((u: any) => (
                <label key={u.firebaseUid || u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.firebaseUid || u.id)}
                    onChange={() => toggleUser(u.firebaseUid || u.id)}
                    className="rounded border-white/20"
                  />
                  <span className="text-sm text-[#f5f5f7]">{u.name || u.email}</span>
                  <span className="text-xs text-[#888899] ml-auto">{u.email}</span>
                </label>
              ))}
              {userSearch && users.length === 0 && (
                <p className="text-xs text-[#888899] px-2">No users found</p>
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-xs text-[#888899] mt-1">{selectedUserIds.length} user(s) selected</p>
            )}
          </div>
        )}

        {recipientType === "CUSTOM" && (
          <div>
            <textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com, ..."
              rows={3}
              className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 resize-y"
            />
          </div>
        )}
      </motion.div>

      {/* Preview As User */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <h3 className="text-xs font-semibold text-[#888899]">Preview As User</h3>
        <div className="relative">
          <button
            onClick={() => setUserListOpen(!userListOpen)}
            className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] text-left flex items-center justify-between cursor-pointer"
          >
            <span className={previewUserId ? "text-[#f5f5f7]" : "text-[#555566]"}>
              {previewUserId
                ? userList.find((u: any) => u.id === previewUserId)?.name || previewUserId
                : "Select a user to preview..."}
            </span>
            <ChevronDown size={14} className="text-[#555566]" />
          </button>
          {userListOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-[#1a1a28] border border-white/10 rounded-xl shadow-xl w-full max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-2">
                <input
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-[#08080f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#f5f5f7] outline-none focus:border-blue-500/50"
                />
              </div>
              {userList
                .filter((u: any) => !userSearchQuery || (u.name || u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase()))
                .slice(0, 20)
                .map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setPreviewUserId(u.id);
                      setUserListOpen(false);
                      setPreviewResult(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#f5f5f7] hover:bg-white/5 cursor-pointer"
                  >
                    {u.name || "Unnamed"} <span className="text-[#555566]">{u.email}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            if (!previewUserId) return;
            setPreviewLoading(true);
            try {
              const res = await api("/owner/email/preview", {
                method: "POST",
                body: JSON.stringify({ subject, body, userId: previewUserId }),
              });
              setPreviewResult(res);
            } catch (e: any) {
              console.error("Preview failed", e);
            } finally {
              setPreviewLoading(false);
            }
          }}
          disabled={!previewUserId || previewLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          {previewLoading ? "Rendering..." : "Render Preview"}
        </button>
        {previewResult && (
          <div className="space-y-2 border border-white/5 rounded-xl p-3">
            <div>
              <span className="text-[10px] text-[#555566] uppercase tracking-wider">Subject</span>
              <p className="text-sm text-[#f5f5f7] mt-0.5">{previewResult.renderedSubject}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#555566] uppercase tracking-wider">Body</span>
              <div
                className="bg-white rounded-lg p-3 mt-0.5 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewResult.renderedBody }}
              />
            </div>
            <p className="text-[10px] text-[#555566]">Previewed for: {previewResult.user.name} ({previewResult.user.email})</p>
          </div>
        )}
      </div>

      {/* Send + Result */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "Sending..." : "Send Broadcast"}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl text-sm space-y-1 ${
            result.error
              ? "bg-red-500/10 text-red-300 border border-red-500/10"
              : result.failed > 0 && result.delivered === 0
              ? "bg-red-500/10 text-red-300 border border-red-500/10"
              : result.failed > 0
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/10"
              : "bg-green-500/10 text-green-300 border border-green-500/10"
          }`}
        >
          {result.error ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1 font-medium">✗ Error</p>
              <p className="text-xs opacity-80">{result.error}</p>
              <p className="text-xs opacity-60 mt-1">Check SMTP settings: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">
                {result.delivered > 0
                  ? `✓ Successfully sent to ${result.delivered} of ${result.total} recipient${result.total !== 1 ? "s" : ""}`
                  : `✗ Failed to send. 0 delivered of ${result.total}`}
              </p>
              <div className="flex gap-4 text-xs opacity-80">
                <span>Recipients: {result.total}</span>
                <span>Delivered: {result.delivered}</span>
                <span>Failed: {result.failed}</span>
              </div>
              {result.failed > 0 && (
                <p className="text-xs mt-1">Some emails failed. Check SMTP settings and try again.</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Campaign History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-[#f5f5f7] mb-4">Campaign History</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-[#888899]">No campaigns sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#888899] border-b border-white/5">
                  <th className="text-left py-2 pr-4 font-medium">Subject</th>
                  <th className="text-left py-2 pr-4 font-medium">Recipients</th>
                  <th className="text-left py-2 pr-4 font-medium">Sent</th>
                  <th className="text-left py-2 pr-4 font-medium">Status</th>
                  <th className="text-left py-2 pr-4 font-medium">Delivered</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="border-b border-white/5 text-[#f5f5f7]">
                    <td className="py-3 pr-4 max-w-[200px] truncate">{c.subject}</td>
                    <td className="py-3 pr-4 text-[#888899]">{c.recipientCount}</td>
                    <td className="py-3 pr-4 text-[#888899] text-xs">
                      {new Date(c.sentAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === "SENT"
                          ? "bg-green-500/10 text-green-300"
                          : "bg-red-500/10 text-red-300"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#888899]">
                      {c.deliveredCount}/{c.recipientCount}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="p-1.5 rounded-lg text-[#888899] hover:text-red-400 hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
