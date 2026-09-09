module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "no-cross-feature-internal", severity: "error",
      comment: "feature import _internal ของ feature อื่นไม่ได้ — ใช้ public API",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/(?!\\1)([^/]+)/_internal/" },
    },
    {
      name: "no-app-to-internal", severity: "error",
      from: { path: "^src/(app|components|hooks|i18n)/" },
      to: { path: "^src/features/[^/]+/_internal/" },
    },
    {
      name: "no-features-to-app", severity: "error",
      comment: "ทิศทาง app → features → shared เท่านั้น",
      from: { path: "^src/features/" },
      to: { path: "^src/(app/|i18n/|permissions\\.ts$)" },
    },
    {
      name: "no-shared-to-features", severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(features|app|components|hooks|i18n)/" },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^src/generated/|\\.test\\.tsx?$)" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default", "types"] },
  },
};
