import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so these are spread
// directly rather than routed through @eslint/eslintrc's FlatCompat.
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // src/design-system is vendored: copied verbatim from the dos-tazas-design-system
    // repo so it can be re-synced when that repo moves. Editing it here to satisfy a
    // lint rule would create exactly the drift the copy is meant to avoid, so the one
    // rule it trips is scoped off instead.
    //
    // The rule in question is react-hooks/set-state-in-effect firing on Modal's
    // `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`
    // — the standard guard for a component that portals to document.body and must not
    // run during SSR. Fix it upstream in the design system, not here.
    files: ["src/design-system/**/*.{ts,tsx}"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
];

export default eslintConfig;
