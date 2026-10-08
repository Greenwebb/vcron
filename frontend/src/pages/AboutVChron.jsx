import Logo from "@/components/Logo";
export default function AboutVChron() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6 text-slate-900">
      <Logo size="lg" />
      <h1 className="text-2xl font-bold">About VChron</h1>
      <p className="text-slate-600">VChron helps teams record attendance, track shifts, and review attendance reports.</p>
      <p className="text-slate-600">A product of GreenWebb.</p>
    </section>
  );
}
