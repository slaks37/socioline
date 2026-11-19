import { defineConfig } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...next,
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);
