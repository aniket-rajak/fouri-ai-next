"use client";

import { useState, useRef, useEffect } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Eye, Copy, Trash2, FileText,
  Upload, Link as LinkIcon, ImageIcon, AlertCircle, Images, ChevronDown,
} from "lucide-react";
import { getFileUrl } from "@/lib/getFileUrl";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const BRANDING_FIELDS = [
  {
    key: "logoUrl" as const,
    label: "Company Logo",
    hint: "Size: 300 × 100 px | Format: PNG (transparent) | Max: 2 MB",
    previewStyle: { maxHeight: "60px" },
  },
  {
    key: "headerImage" as const,
    label: "Header Banner",
    hint: "Size: 1200 × 400 px | Format: JPG or PNG | Aspect Ratio: 3:1 | Max: 5 MB",
    previewStyle: { maxWidth: "100%", maxHeight: "200px" },
  },
  {
    key: "footerLogo" as const,
    label: "Footer Logo",
    hint: "Size: 200 × 60 px | Format: PNG | Max: 2 MB",
    previewStyle: { maxHeight: "40px" },
  },
];

const DEFAULT_EMAIL_BODY = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FOURI Feature Update</title>
</head>

<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:30px 15px;background:#0f172a;">
<tr>
<td align="center">

<table width="560" cellpadding="0" cellspacing="0" border="0"
style="max-width:560px;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

    <!-- Title Banner -->
    <tr>
        <td align="center" style="padding:36px 32px 0 32px;">
            <h1 style="margin:0;color:#f1f5f9;font-size:28px;font-weight:700;letter-spacing:-0.3px;">
                New Feature Released
            </h1>
            <p style="margin:10px 0 0 0;color:#94a3b8;font-size:15px;font-weight:400;">
                Discover what's new in FOURI
            </p>
        </td>
    </tr>

    <!-- Body -->
    <tr>
        <td style="padding:36px 32px;color:#cbd5e1;line-height:1.8;">

            <p style="margin:0 0 22px 0;font-size:16px;">
                Hello <strong style="color:#60a5fa;">{{name}}</strong>,
            </p>

            <p style="margin:0 0 28px 0;font-size:15px;color:#94a3b8;">
                We're thrilled to introduce a new feature designed to enhance your learning journey with FOURI. This update makes your experience smarter, faster, and more interactive.
            </p>

            <!-- Feature Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:linear-gradient(135deg,#1e3a5f,#172554);border-radius:10px;">
                <tr>
                    <td style="padding:24px;">

                        <h2 style="margin:0 0 10px 0;color:#60a5fa;font-size:20px;font-weight:700;">
                            {{feature_name}}
                        </h2>

                        <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.7;">
                            {{feature_description}}
                        </p>

                    </td>
                </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
                <tr>
                    <td align="center">

                        <a href="{{feature_link}}"
                           style="display:inline-block;
                                  background:linear-gradient(135deg,#2563eb,#1d4ed8);
                                  color:#ffffff;
                                  text-decoration:none;
                                  padding:14px 36px;
                                  border-radius:8px;
                                  font-size:15px;
                                  font-weight:600;
                                  box-shadow:0 4px 14px rgba(37,99,235,0.35);">
                            Explore Feature
                        </a>

                    </td>
                </tr>
            </table>

            <p style="margin:30px 0 0 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                Thank you for being part of the FOURI community. Your support and feedback help us build better learning experiences for everyone.
            </p>

        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

export default function EmailTemplatesPage() {
  const api = useOwnerApi();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [footerLogo, setFooterLogo] = useState("");
  const [copyright, setCopyright] = useState("© FOURI Technologies. All Rights Reserved.");

  // Upload states per field
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [inputMode, setInputMode] = useState<Record<string, "upload" | "url">>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Image preview loading states per field
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<string, "success" | "error" | null>>({});
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const objectUrlsRef = useRef<Record<string, string>>({});

  // Pre-fetch images via fetch (allowed by connect-src) and create blob URLs.
  // This bypasses CSP img-src / Content-Type + nosniff issues entirely.
  useEffect(() => {
    const entries: [string, string][] = [
      ["logoUrl", logoUrl],
      ["headerImage", headerImage],
      ["footerLogo", footerLogo],
    ];

    for (const [key, val] of entries) {
      if (!val) {
        // Clear blob URL if field is empty
        if (objectUrlsRef.current[key]) {
          URL.revokeObjectURL(objectUrlsRef.current[key]);
          delete objectUrlsRef.current[key];
          setObjectUrls((prev) => { const n = { ...prev }; delete n[key]; return n; });
        }
        continue;
      }

      console.log(`[Image Debug] 🔄 ${key} URL set:`, val);
      setImageLoading((prev) => ({ ...prev, [key]: true }));
      setImageLoaded((prev) => ({ ...prev, [key]: null }));
      setUploadErrors((prev) => ({ ...prev, [key]: "" }));

      // Revoke previous blob URL for this field
      if (objectUrlsRef.current[key]) {
        URL.revokeObjectURL(objectUrlsRef.current[key]);
      }

      // Fetch the image and create a blob URL
      const resolvedVal = getFileUrl(val);
      (async () => {
        try {
          const res = await fetch(resolvedVal);
          if (!res.ok) {
            console.error(`[Image Debug] ❌ ${key} fetch status ${res.status}:`, resolvedVal);
            setImageLoading((prev) => ({ ...prev, [key]: false }));
            setImageLoaded((prev) => ({ ...prev, [key]: "error" }));
            return;
          }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          objectUrlsRef.current[key] = blobUrl;
          setObjectUrls((prev) => ({ ...prev, [key]: blobUrl }));
          setImageLoading((prev) => ({ ...prev, [key]: false }));
          // imageLoaded will be set to "success" by <img onLoad>
          setUploadErrors((prev) => ({ ...prev, [key]: "" }));
          console.log(`[Image Debug] ✅ ${key} fetched (${blob.type}, ${blob.size} bytes):`, val);
        } catch (err: any) {
          console.error(`[Image Debug] ❌ ${key} fetch error:`, err?.message || err, val);
          setImageLoading((prev) => ({ ...prev, [key]: false }));
          setImageLoaded((prev) => ({ ...prev, [key]: "error" }));
          setUploadErrors((prev) => ({ ...prev, [key]: `Network error: ${err?.message || "Failed to fetch"}` }));
        }
      })();
    }

    // Cleanup all blob URLs on unmount
    return () => {
      for (const url of Object.values(objectUrlsRef.current)) {
        if (url) URL.revokeObjectURL(url);
      }
      objectUrlsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, headerImage, footerLogo]);

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

  // Media library picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string>("logoUrl");

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const res = await api("/owner/email/templates");
        setTemplates(res.templates || []);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close variable picker on click outside
  useEffect(() => {
    const handler = () => setVarPickerOpen(null);
    if (varPickerOpen) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [varPickerOpen]);

  const resetForm = () => {
    setName("Feature Update");
    setSubject("New Feature Alert — {{name}}");
    setBody(DEFAULT_EMAIL_BODY);
    setLogoUrl("");
    setHeaderImage("");
    setFooterLogo("");
    setCopyright("© 2026 FOURI.IN. All rights reserved. Built by Aniket Rajak");
    setEditingId(null);
    setShowForm(false);
    setShowPreview(false);
    setInputMode({});
    setUploadErrors({});
  };

  const editTemplate = (t: any) => {
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
    setLogoUrl(t.logoUrl || "");
    setHeaderImage(t.headerImage || "");
    setFooterLogo(t.footerLogo || "");
    setCopyright(t.copyright || "© 2026 FOURI.IN. All rights reserved. Built by Aniket Rajak");
    setEditingId(t.id);
    setShowForm(true);
    setShowPreview(false);
    setInputMode({});
    setUploadErrors({});
  };

  const duplicateTemplate = async (id: string) => {
    try {
      const res = await api(`/owner/email/templates/${id}/duplicate`, { method: "POST" });
      setTemplates((prev) => [res.template, ...prev]);
    } catch {
      // handle error
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api(`/owner/email/templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // handle error
    }
  };

  const handleImageUpload = async (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setUploadErrors((prev) => ({ ...prev, [fieldKey]: "Unsupported format. Use JPG, PNG, WebP, or SVG." }));
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors((prev) => ({ ...prev, [fieldKey]: "File too large. Maximum 10 MB." }));
      return;
    }

    setUploadErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    setUploading((prev) => ({ ...prev, [fieldKey]: true }));

    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("fouri_owner_token");
      console.log(`[Image Debug] ⬆️ Uploading ${fieldKey}:`, file.name, file.size, file.type);
      const res = await fetch(`${API_BASE}/owner/email/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json() as { url?: string };
      if (!data.url) {
        console.error(`[Image Debug] ❌ Upload response missing url:`, data);
        setUploadErrors((prev) => ({ ...prev, [fieldKey]: "Upload failed — server returned no URL." }));
        return;
      }
      console.log(`[Image Debug] ✅ Upload success, URL:`, data.url);
      const setter = fieldKey === "logoUrl" ? setLogoUrl
        : fieldKey === "headerImage" ? setHeaderImage
        : setFooterLogo;
      setter(data.url);
    } catch (err) {
      console.error(`[Image Debug] ❌ Upload fetch error:`, err);
      setUploadErrors((prev) => ({ ...prev, [fieldKey]: "Upload failed. Try again." }));
    } finally {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));
      // Reset file input so re-selecting same file triggers onChange
      if (fileInputRefs.current[fieldKey]) {
        fileInputRefs.current[fieldKey]!.value = "";
      }
    }
  };

  const getUrlValue = (key: string) => {
    if (key === "logoUrl") return logoUrl;
    if (key === "headerImage") return headerImage;
    return footerLogo;
  };

  const setUrlValue = (key: string, val: string) => {
    if (key === "logoUrl") setLogoUrl(val);
    else if (key === "headerImage") setHeaderImage(val);
    else setFooterLogo(val);
  };

  const openMediaPicker = async (targetKey: string) => {
    setPickerTarget(targetKey);
    setShowMediaPicker(true);
    setMediaLoading(true);
    try {
      const res = await api("/owner/media");
      setMediaFiles(res.files || []);
    } catch {
      setMediaFiles([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const selectFromMedia = (url: string) => {
    setUrlValue(pickerTarget, url);
    setShowMediaPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        body,
        logoUrl: logoUrl || undefined,
        headerImage: headerImage || undefined,
        footerLogo: footerLogo || undefined,
        copyright: copyright || undefined,
      };

      if (editingId) {
        const res = await api(`/owner/email/templates/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? res.template : t)));
      } else {
        const res = await api("/owner/email/templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setTemplates((prev) => [res.template, ...prev]);
      }
      resetForm();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; padding: 0; border: 1px solid #334155;">
      ${logoUrl && objectUrls["logoUrl"] ? `<div style="text-align: center; padding: 24px 20px 16px 20px;"><img src="${objectUrls["logoUrl"]}" width="150" height="150" style="display: block; width: 150px; height: 150px; max-width: 100%; margin: 0 auto;" /></div>` : ""}
      ${headerImage && objectUrls["headerImage"] ? `<div style="text-align: center; line-height: 0;"><img src="${objectUrls["headerImage"]}" style="display: block; width: 100%; max-width: 560px; height: auto;" /></div>` : ""}
      <div style="padding: 0;">${body}</div>
      ${footerLogo && objectUrls["footerLogo"] ? `<div style="text-align: center; padding: 24px 20px 16px 20px;"><img src="${objectUrls["footerLogo"]}" width="100" height="100" style="display: block; width: 100px; height: 100px; max-width: 100%; margin: 0 auto;" /></div>` : ""}
      <div style="text-align: center; padding: 20px 30px; border-top: 1px solid #334155;">
        <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">Team FOURI</p>
        <p style="margin: 0; color: #64748b; font-size: 13px;">AI-Powered Learning Platform</p>
      </div>
      ${copyright ? `<div style="text-align: center; padding: 0 30px 24px 30px;"><p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">${copyright}</p></div>` : ""}
    </div>
  `;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f7]">Email Templates</h1>
          <p className="text-sm text-[#888899] mt-1">Create and manage reusable email templates.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-sm font-semibold text-[#f5f5f7]">
              {editingId ? "Edit Template" : "Create Template"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#888899] mb-1.5">Template Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Welcome Email"
                  className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#888899]">Subject Line</label>
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
                  placeholder="Welcome to FOURI!"
                  className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

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
                  className="bg-white rounded-xl p-4 min-h-[200px] text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
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

            {/* Branding */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-[#f5f5f7]">Branding</h3>

              {/* Guidance note */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>For the best email appearance, use high-quality images with the recommended dimensions. Oversized images may increase email loading time and reduce deliverability.</span>
              </div>

              {BRANDING_FIELDS.map((field) => {
                const currentValue = getUrlValue(field.key);
                const mode = inputMode[field.key] || "url";
                const isUploading = uploading[field.key];
                const error = uploadErrors[field.key];

                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[#888899] font-medium">{field.label}</label>
                      <span className="text-[10px] text-[#555566]">Optional</span>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-1.5 mb-1.5">
                      <button
                        onClick={() => setInputMode((prev) => ({ ...prev, [field.key]: "url" }))}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          mode === "url"
                            ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                            : "bg-white/5 text-[#888899] hover:text-[#f5f5f7]"
                        }`}
                      >
                        <LinkIcon size={12} /> URL
                      </button>
                      <button
                        onClick={() => setInputMode((prev) => ({ ...prev, [field.key]: "upload" }))}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          mode === "upload"
                            ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                            : "bg-white/5 text-[#888899] hover:text-[#f5f5f7]"
                        }`}
                      >
                        <Upload size={12} /> Upload
                      </button>
                    </div>

                    {/* URL mode */}
                    {mode === "url" && (
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
                          <input
                            value={currentValue}
                            onChange={(e) => setUrlValue(field.key, e.target.value.trim())}
                            placeholder="https://example.com/image.png"
                            className="w-full bg-[#08080f] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload mode */}
                    {mode === "upload" && (
                      <div>
                        <input
                          ref={(el) => { fileInputRefs.current[field.key] = el; }}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                          onChange={(e) => handleImageUpload(field.key, e)}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRefs.current[field.key]?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2 w-full bg-[#08080f] border border-dashed border-white/10 rounded-xl px-4 py-3 text-sm text-[#888899] hover:text-[#f5f5f7] hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isUploading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Upload size={16} />
                          )}
                          {isUploading ? "Uploading..." : "Click to upload from device"}
                        </button>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {error}
                      </p>
                    )}

                    {/* Size hint */}
                    <p className="text-[10px] text-[#555566]">{field.hint}</p>

                    {/* Select from Media Library */}
                    <button
                      onClick={() => openMediaPicker(field.key)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <Images size={12} /> Select from Media Library
                    </button>

                    {/* Image preview — only render <img> when blob URL is ready (avoids CSP/Content-Type issues) */}
                    {currentValue && (
                      <div className="bg-[#08080f] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-h-[80px]">
                        {imageLoading[field.key] && imageLoaded[field.key] !== "error" && (
                          <div className="flex items-center gap-2 text-xs text-[#888899] mb-2">
                            <Loader2 size={14} className="animate-spin" />
                            Loading image preview...
                          </div>
                        )}
                        {objectUrls[field.key] && (
                          <>
                            <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                              ✓ Image loaded successfully
                            </p>
                            <img
                              src={objectUrls[field.key]}
                              alt={field.label}
                              style={field.previewStyle}
                              className="max-w-full object-contain"
                              onLoad={() => {
                                console.log(`[Image Debug] ✅ ${field.key} displayed`);
                              }}
                              onError={() => {
                                console.error(`[Image Debug] ❌ ${field.key} blob URL failed`);
                                setImageLoaded((prev) => ({ ...prev, [field.key]: "error" }));
                              }}
                            />
                          </>
                        )}
                        {imageLoaded[field.key] === "error" && !uploadErrors[field.key] && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            ✗ Unable to load image
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Copyright */}
              <div>
                <label className="block text-xs text-[#888899] mb-1.5">Copyright Notice</label>
                <input
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  placeholder="© FOURI Technologies. All Rights Reserved."
                  className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Media Library Picker Modal */}
            <AnimatePresence>
              {showMediaPicker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                  onClick={() => setShowMediaPicker(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#111118] border border-white/5 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#f5f5f7]">Select Image</h3>
                      <button
                        onClick={() => setShowMediaPicker(false)}
                        className="text-[#888899] hover:text-[#f5f5f7] cursor-pointer text-sm"
                      >
                        Close
                      </button>
                    </div>

                    {mediaLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                      </div>
                    ) : mediaFiles.length === 0 ? (
                      <p className="text-sm text-[#888899] text-center py-8">
                        No images in the library. Upload some first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {mediaFiles.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => selectFromMedia(getFileUrl(f.url))}
                            className="bg-[#08080f] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer text-left group"
                          >
                            <div className="aspect-square bg-[#0a0a14] flex items-center justify-center p-2">
                              <img
                                src={getFileUrl(f.url)}
                                alt={f.originalName}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <p className="text-[10px] text-[#888899] truncate px-2 py-1.5 group-hover:text-[#f5f5f7]">
                              {f.originalName}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6"
      >
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={32} className="text-[#888899] mb-3" />
            <p className="text-sm text-[#888899]">No templates yet.</p>
            <p className="text-xs text-[#555566] mt-1">Create your first template to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((t: any) => (
              <div
                key={t.id}
                className="bg-[#08080f] border border-white/5 rounded-xl p-4 space-y-3 hover:border-white/10 transition-all"
              >
                <div>
                  <h3 className="text-sm font-medium text-[#f5f5f7] truncate">{t.name}</h3>
                  <p className="text-xs text-[#888899] mt-0.5 truncate">{t.subject}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555566]">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => editTemplate(t)}
                      className="p-1.5 rounded-lg text-[#888899] hover:text-blue-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(t.id)}
                      className="p-1.5 rounded-lg text-[#888899] hover:text-green-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="p-1.5 rounded-lg text-[#888899] hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
