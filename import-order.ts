export interface ImportOrderOptions {
  sortImports?: boolean;
  sortExports?: boolean;
  spaceBetweenGroups?: boolean;
}

interface ImportGroup {
  imports: Deno.lint.ImportDeclaration[];
  type: "built-in" | "http" | "external" | "local";
}

interface ExportGroup {
  exports: Deno.lint.ExportNamedDeclaration[];
  type: "built-in" | "http" | "external" | "local";
}

const getSpecifier = (path: string) => {
  const colonIndex = path.indexOf(":");
  if (colonIndex === -1) return null;
  return path.substring(0, colonIndex);
};

const categorizeImport = (node: Deno.lint.ImportDeclaration) => {
  const source = node.source.value;
  const specifier = getSpecifier(source);

  if (specifier === "node") return "built-in";
  if (source.startsWith("/") || source.startsWith(".")) return "local";
  if (specifier === "http" || specifier === "https") return "http";
  return "external";
};

const categorizeExport = (node: Deno.lint.ExportNamedDeclaration) => {
  if (!node.source) return "local";
  const source = node.source.value;
  const specifier = getSpecifier(source);

  if (specifier === "node") return "built-in";
  if (source.startsWith("/") || source.startsWith(".")) return "local";
  if (specifier === "http" || specifier === "https") return "http";
  return "external";
};

const sortImportsBySource = (imports: Deno.lint.ImportDeclaration[]) => {
  return imports.sort((a, b) => a.source.value.localeCompare(b.source.value));
};

const sortExportsBySource = (exports: Deno.lint.ExportNamedDeclaration[]) => {
  return exports.sort((a, b) => {
    if (!a.source && !b.source) return 0;
    if (!a.source) return -1;
    if (!b.source) return 1;
    return a.source.value.localeCompare(b.source.value);
  });
};

const groupAndSortImports = (importNodes: Deno.lint.ImportDeclaration[]) => {
  const groups: Record<string, Deno.lint.ImportDeclaration[]> = {
    "built-in": [],
    http: [],
    external: [],
    local: [],
  };

  for (const node of importNodes) {
    const category = categorizeImport(node);
    groups[category].push(node);
  }

  const sortedGroups: ImportGroup[] = [];
  for (const type of ["built-in", "http", "external", "local"] as const) {
    if (groups[type].length > 0) {
      sortedGroups.push({
        type,
        imports: sortImportsBySource(groups[type]),
      });
    }
  }

  return sortedGroups;
};

const groupAndSortExports = (
  exportNodes: Deno.lint.ExportNamedDeclaration[]
) => {
  const groups: Record<string, Deno.lint.ExportNamedDeclaration[]> = {
    "built-in": [],
    http: [],
    external: [],
    local: [],
  };

  for (const node of exportNodes) {
    const category = categorizeExport(node);
    groups[category].push(node);
  }

  const sortedGroups: ExportGroup[] = [];
  for (const type of ["built-in", "http", "external", "local"] as const) {
    if (groups[type].length > 0) {
      sortedGroups.push({
        type,
        exports: sortExportsBySource(groups[type]),
      });
    }
  }

  return sortedGroups;
};

const flattenGroups = (groups: ImportGroup[]) => {
  return groups.flatMap((group) => group.imports);
};

const flattenExportGroups = (groups: ExportGroup[]) => {
  return groups.flatMap((group) => group.exports);
};

const needsReordering = (
  importNodes: Deno.lint.ImportDeclaration[],
  sortedImports: Deno.lint.ImportDeclaration[]
) => {
  return sortedImports.some((node, index) => node !== importNodes[index]);
};

const hasIncorrectSpacing = (
  importNodes: Deno.lint.ImportDeclaration[],
  groups: ImportGroup[],
  context: Deno.lint.RuleContext
) => {
  let nodeIndex = 0;

  for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
    const group = groups[groupIdx];
    const isLastGroup = groupIdx === groups.length - 1;

    for (let i = 0; i < group.imports.length; i++) {
      const isLastInGroup = i === group.imports.length - 1;

      if (!isLastGroup && isLastInGroup && nodeIndex < importNodes.length - 1) {
        const currentNode = importNodes[nodeIndex];
        const nextNode = importNodes[nodeIndex + 1];

        const textBetween = context.sourceCode.getText({
          range: [currentNode.range[1], nextNode.range[0]],
        } as Deno.lint.Node);

        const newlineCount = (textBetween.match(/\n/g) || []).length;
        if (newlineCount < 2) {
          return true;
        }
      }
      nodeIndex++;
    }
  }

  return false;
};

const needsExportReordering = (
  exportNodes: Deno.lint.ExportNamedDeclaration[],
  sortedExports: Deno.lint.ExportNamedDeclaration[]
) => {
  return sortedExports.some((node, index) => node !== exportNodes[index]);
};

const hasIncorrectExportSpacing = (
  exportNodes: Deno.lint.ExportNamedDeclaration[],
  groups: ExportGroup[],
  context: Deno.lint.RuleContext
) => {
  let nodeIndex = 0;

  for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
    const group = groups[groupIdx];
    const isLastGroup = groupIdx === groups.length - 1;

    for (let i = 0; i < group.exports.length; i++) {
      const isLastInGroup = i === group.exports.length - 1;

      if (!isLastGroup && isLastInGroup && nodeIndex < exportNodes.length - 1) {
        const currentNode = exportNodes[nodeIndex];
        const nextNode = exportNodes[nodeIndex + 1];

        const textBetween = context.sourceCode.getText({
          range: [currentNode.range[1], nextNode.range[0]],
        } as Deno.lint.Node);

        const newlineCount = (textBetween.match(/\n/g) || []).length;
        if (newlineCount < 2) {
          return true;
        }
      }
      nodeIndex++;
    }
  }

  return false;
};

const getReportRange = (
  importNodes: Deno.lint.ImportDeclaration[],
  sortedImports: Deno.lint.ImportDeclaration[]
): Deno.lint.Range => {
  const firstMismatch = importNodes.find(
    (node, index) => node !== sortedImports[index]
  )!;
  const lastMismatch = importNodes.findLast(
    (node, index) => node !== sortedImports[index]
  )!;
  return [firstMismatch.range[0], lastMismatch.range[1]];
};

const getExportReportRange = (
  exportNodes: Deno.lint.ExportNamedDeclaration[],
  sortedExports: Deno.lint.ExportNamedDeclaration[]
): Deno.lint.Range => {
  const firstMismatch = exportNodes.find(
    (node, index) => node !== sortedExports[index]
  )!;
  const lastMismatch = exportNodes.findLast(
    (node, index) => node !== sortedExports[index]
  )!;
  return [firstMismatch.range[0], lastMismatch.range[1]];
};

const generateFixesWithSpacing = (
  importNodes: Deno.lint.ImportDeclaration[],
  groups: ImportGroup[],
  context: Deno.lint.RuleContext,
  fixer: Deno.lint.Fixer
) => {
  const groupTexts: string[] = [];

  for (const group of groups) {
    const importsText = group.imports
      .map((node) => context.sourceCode.getText(node))
      .join("\n");
    groupTexts.push(importsText);
  }

  const newText = groupTexts.join("\n\n");
  const range: Deno.lint.Range = [
    importNodes[0].range[0],
    importNodes[importNodes.length - 1].range[1],
  ];

  return [fixer.replaceTextRange(range, newText)];
};

const generateFixesWithoutSpacing = (
  importNodes: Deno.lint.ImportDeclaration[],
  sortedImports: Deno.lint.ImportDeclaration[],
  context: Deno.lint.RuleContext,
  fixer: Deno.lint.Fixer
) => {
  const fixes: Deno.lint.Fix[] = [];

  for (let i = 0; i < importNodes.length; i++) {
    if (importNodes[i] !== sortedImports[i]) {
      fixes.push(
        fixer.replaceTextRange(
          importNodes[i].range,
          context.sourceCode.getText(sortedImports[i])
        )
      );
    }
  }

  return fixes;
};

const generateExportFixesWithSpacing = (
  exportNodes: Deno.lint.ExportNamedDeclaration[],
  groups: ExportGroup[],
  context: Deno.lint.RuleContext,
  fixer: Deno.lint.Fixer
) => {
  const groupTexts: string[] = [];

  for (const group of groups) {
    const exportsText = group.exports
      .map((node) => context.sourceCode.getText(node))
      .join("\n");
    groupTexts.push(exportsText);
  }

  const newText = groupTexts.join("\n\n");
  const range: Deno.lint.Range = [
    exportNodes[0].range[0],
    exportNodes[exportNodes.length - 1].range[1],
  ];

  return [fixer.replaceTextRange(range, newText)];
};

const generateExportFixesWithoutSpacing = (
  exportNodes: Deno.lint.ExportNamedDeclaration[],
  sortedExports: Deno.lint.ExportNamedDeclaration[],
  context: Deno.lint.RuleContext,
  fixer: Deno.lint.Fixer
) => {
  const fixes: Deno.lint.Fix[] = [];

  for (let i = 0; i < exportNodes.length; i++) {
    if (exportNodes[i] !== sortedExports[i]) {
      fixes.push(
        fixer.replaceTextRange(
          exportNodes[i].range,
          context.sourceCode.getText(sortedExports[i])
        )
      );
    }
  }

  return fixes;
};

export const createImportOrderPlugin = (
  options: ImportOrderOptions = {}
): Deno.lint.Plugin => {
  const {
    sortImports = true,
    sortExports = true,
    spaceBetweenGroups = false,
  } = options;

  return {
    name: "import-order",
    rules: {
      "import-order": {
        create(context) {
          const importNodes: Deno.lint.ImportDeclaration[] = [];
          const exportNodes: Deno.lint.ExportNamedDeclaration[] = [];

          return {
            ImportDeclaration(node) {
              if (sortImports) {
                importNodes.push(node);
              }
            },

            ExportNamedDeclaration(node) {
              if (sortExports && node.source) {
                exportNodes.push(node);
              }
            },

            "Program:exit"() {
              if (sortImports && importNodes.length > 1) {
                const groups = groupAndSortImports(importNodes);
                const sortedImports = flattenGroups(groups);
                const needsReorder = needsReordering(
                  importNodes,
                  sortedImports
                );
                const needsSpacingFix =
                  spaceBetweenGroups &&
                  groups.length > 1 &&
                  hasIncorrectSpacing(importNodes, groups, context);

                if (needsReorder || needsSpacingFix) {
                  const range: Deno.lint.Range = needsReorder
                    ? getReportRange(importNodes, sortedImports)
                    : [
                        importNodes[0].range[0],
                        importNodes[importNodes.length - 1].range[1],
                      ];

                  context.report({
                    range,
                    message: "Imports are not properly ordered",
                    hint: "Imports should be ordered by type (built-in, http, external, local) and alphabetically",
                    fix: (fixer) => {
                      if (spaceBetweenGroups) {
                        return generateFixesWithSpacing(
                          importNodes,
                          groups,
                          context,
                          fixer
                        );
                      }
                      return generateFixesWithoutSpacing(
                        importNodes,
                        sortedImports,
                        context,
                        fixer
                      );
                    },
                  });
                }
              }

              if (sortExports && exportNodes.length > 1) {
                const groups = groupAndSortExports(exportNodes);
                const sortedExports = flattenExportGroups(groups);
                const needsReorder = needsExportReordering(
                  exportNodes,
                  sortedExports
                );
                const needsSpacingFix =
                  spaceBetweenGroups &&
                  groups.length > 1 &&
                  hasIncorrectExportSpacing(exportNodes, groups, context);

                if (needsReorder || needsSpacingFix) {
                  const range: Deno.lint.Range = needsReorder
                    ? getExportReportRange(exportNodes, sortedExports)
                    : [
                        exportNodes[0].range[0],
                        exportNodes[exportNodes.length - 1].range[1],
                      ];

                  context.report({
                    range,
                    message: "Exports are not properly ordered",
                    hint: "Exports should be ordered by type (built-in, http, external, local) and alphabetically",
                    fix: (fixer) => {
                      if (spaceBetweenGroups) {
                        return generateExportFixesWithSpacing(
                          exportNodes,
                          groups,
                          context,
                          fixer
                        );
                      }
                      return generateExportFixesWithoutSpacing(
                        exportNodes,
                        sortedExports,
                        context,
                        fixer
                      );
                    },
                  });
                }
              }
            },
          };
        },
      },
    },
  };
};

export default createImportOrderPlugin() as Deno.lint.Plugin;

export const importOrderWithSpacing = createImportOrderPlugin({
  spaceBetweenGroups: true,
}) as Deno.lint.Plugin;

export const importOrderOnly = createImportOrderPlugin({
  sortImports: true,
  sortExports: false,
}) as Deno.lint.Plugin;

export const exportOrderOnly = createImportOrderPlugin({
  sortImports: false,
  sortExports: true,
}) as Deno.lint.Plugin;
