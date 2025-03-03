const getSpecifier = (path: string) => {
  const dot = path.indexOf(":");
  if (!dot) return null;
  return path.substring(0, dot);
};

const sortImports = (importNodes: Deno.lint.ImportDeclaration[]) => {
  const builtInImports: Deno.lint.ImportDeclaration[] = [];
  const httpImports: Deno.lint.ImportDeclaration[] = [];
  const externalImports: Deno.lint.ImportDeclaration[] = [];
  const localImports: Deno.lint.ImportDeclaration[] = [];

  for (const node of importNodes) {
    const source = node.source.value;
    const specifier = getSpecifier(source);

    const isBuiltIn = specifier === "node"; // import xxx from "node:xxx"
    const isLocal = source.startsWith("/") || source.startsWith("."); // import xxx from "./xxx" or "/xxx"
    const isHttpImports = specifier === "http" ||
      specifier === "https"; // import xxx from "http://xxx" or "https://xxx"
    const isSpecifierImports = specifier === "jsr" ||
      specifier === "npm"; // import xxx from "jsr:@xxx/xxx" or import xxx from "npm:xxx"
    // if the rules above are not met, treat is as an external import
    const isExternal = !isBuiltIn && !isLocal && !isHttpImports &&
      !isSpecifierImports;

    if (isBuiltIn) {
      builtInImports.push(node);
    } else if (isHttpImports) {
      httpImports.push(node);
    } else if (isExternal || isSpecifierImports) {
      externalImports.push(node);
    } else if (isLocal) {
      localImports.push(node);
    }
  }

  const sortBySource = (
    a: Deno.lint.ImportDeclaration,
    b: Deno.lint.ImportDeclaration,
  ) => a.source.value.localeCompare(b.source.value);

  builtInImports.sort(sortBySource);
  httpImports.sort(sortBySource);
  externalImports.sort(sortBySource);
  localImports.sort(sortBySource);

  const sortedImports = [
    ...builtInImports,
    ...httpImports,
    ...externalImports,
    ...localImports,
  ];

  return sortedImports;
};

/**
 * Sort imports by type and alphabetically
 *
 * - Built-in imports
 * - Http imports
 * - External imports
 * - Local imports
 */
const importSort: Deno.lint.Plugin = {
  name: "import-order",
  rules: {
    "import-order": {
      create(context) {
        const importNodes: Deno.lint.ImportDeclaration[] = [];

        return {
          ImportDeclaration(node) {
            importNodes.push(node);
          },

          "Program:exit"() {
            if (importNodes.length <= 1) return;

            const sortedImports = sortImports(importNodes);
            const needsFix = sortedImports.some((node, index) =>
              node !== importNodes[index]
            );
            if (!needsFix) return;

            // The report range is the first imports' range that
            // not sorted to the last one's
            const range: Deno.lint.Range = [
              importNodes.find((node, index) => node !== sortedImports[index])!
                .range[0],
              importNodes.findLast((node, index) =>
                node !== sortedImports[index]
              )!.range[1],
            ];

            context.report({
              range,
              message: "The imports are not ordered",
              hint: "All imports should be ordered by type (built-in, http, external, local) and alphabetically. It could be fix by running with --fix",
              fix: (fixer) => {
                const fixes: Deno.lint.Fix[] = [];

                for (let i = 0; i < importNodes.length; i++) {
                  if (importNodes[i] !== sortedImports[i]) {
                    fixes.push(
                      fixer.replaceTextRange(
                        importNodes[i].range,
                        context.sourceCode.getText(sortedImports[i]),
                      ),
                    );
                  }
                }
                return fixes;
              },
            });
          },
        };
      },
    },
  },
};

export default importSort;
