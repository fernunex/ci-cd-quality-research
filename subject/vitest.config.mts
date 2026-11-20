import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const workspace = resolve(process.env.SUBJECT_WORKSPACE ?? "subject");
const profile = process.env.SUBJECT_TEST_PROFILE ?? "high";
if (profile !== "high" && profile !== "low") {
  throw new Error("SUBJECT_TEST_PROFILE debe ser high o low");
}

export default defineConfig({
  root: workspace,
  test: {
    include: profile === "low"
      ? ["test/products.test.ts", "test/cart.test.ts"]
      : ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: ["src/model.ts", "src/index.ts"],
      reporter: ["json-summary", "text"],
      reportsDirectory: resolve(process.env.SUBJECT_COVERAGE_DIR ?? "coverage/subject"),
    },
  },
});
