import { Button } from "@/components/ui/button";

export default function PolicyPage({ title, modal = false, onClose }) {
  return (
    <section className="mx-auto max-w-3xl p-6 text-slate-900">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {modal && <Button type="button" variant="outline" onClick={onClose}>Close</Button>}
      </div>
      <p role="status" className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
        This document is currently unavailable. Please contact your organisation’s administrator for the current {title.toLowerCase()}.
      </p>
    </section>
  );
}
