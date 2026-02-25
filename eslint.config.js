import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react: react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Mantém regras importantes como erro
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": ["error"],

      // Regras de hooks e acessibilidade continuam em warning
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/label-has-associated-control": "warn",

      // React Refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Design system: desliga enforcement de inline styles para reduzir ruído
      "react/forbid-dom-props": "off",

      // Mantém aviso leve para imports de tokens fora do pacote correto
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/tokens.ts", "**/tokens.js"],
              message:
                "Import tokens de @sarradahub/design-system/tokens em vez de arquivos locais",
            },
          ],
        },
      ],
    },
  },
);
