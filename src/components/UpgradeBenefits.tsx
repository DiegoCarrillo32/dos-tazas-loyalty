import { Cake, Sparkles, Star } from "lucide-react";

const BENEFITS = [
  { icon: Star, title: "Descuentos exclusivos", text: "Precios de miembro en bebidas y grano." },
  { icon: Cake, title: "Regalo de cumpleaños", text: "Bebida y repostería gratis en tu mes." },
  { icon: Sparkles, title: "Preventa de lotes", text: "Acceso anticipado a cada nuevo origen." },
];

/** The benefit list, shared by the upgrade CTA and the sign-in screen. */
export function UpgradeBenefits() {
  return (
    <ul className="space-y-4">
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coffee-fruit/10 text-coffee-fruit">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-expresso">{title}</p>
            <p className="text-xs text-expresso/60">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
