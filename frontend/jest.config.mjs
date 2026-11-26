// Jest config for unit + component + integration tests (Part 5).
// next/jest wires up SWC so Jest understands JSX and the "@/..." imports.
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.{js,jsx}"],
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/**/*.stories.{js,jsx}", "!src/app/layout.js"],
};

export default async function jestConfig() {
  const base = await createJestConfig(config)();
  // These packages ship modern ESM only, so Jest must compile them too.
  base.transformIgnorePatterns = ["/node_modules/(?!(cn|@base-ui|lucide-react)/)"];
  return base;
}
