import { assertEquals } from "@std/assert";
import { createImportOrderPlugin } from "./import-order.ts";

Deno.test("import-order - basic reordering without spacing", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: false });
  const source = `import plugin from "./import-order.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assertEquals(diagnostic.id, "import-order/import-order");
  assertEquals(diagnostic.message, "Imports are not properly ordered");
  assertEquals(
    diagnostic.hint,
    "Imports should be ordered by type (built-in, http, external, local) and alphabetically"
  );

  const expectedFix = `import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import plugin from "./import-order.ts";`;
  const fixedCode = applyFixes(source, diagnostic.fix!);
  assertEquals(fixedCode, expectedFix);
});

Deno.test("import-order - with spacing between groups", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: true });
  const source = `import { readFile } from "./utils.ts";
import { serve } from "https://deno.land/std/http/server.ts";
import { Buffer } from "node:buffer";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assertEquals(diagnostic.id, "import-order/import-order");

  const expectedFix = `import { Buffer } from "node:buffer";

import { serve } from "https://deno.land/std/http/server.ts";

import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";

import { readFile } from "./utils.ts";`;
  const fixedCode = applyFixes(source, diagnostic.fix!);
  assertEquals(fixedCode, expectedFix);
});

Deno.test("import-order - already sorted imports (no spacing)", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: false });
  const source = `import { Buffer } from "node:buffer";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import { readFile } from "./utils.ts";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("import-order - already sorted imports (with spacing)", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: true });
  const source = `import { Buffer } from "node:buffer";

import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";

import { readFile } from "./utils.ts";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("import-order - mixed categories", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: false });
  const source = `import { z } from "npm:zod";
import { Buffer } from "node:buffer";
import { serve } from "https://deno.land/std/http/server.ts";
import { helper } from "./helper.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];

  const expectedFix = `import { Buffer } from "node:buffer";
import { serve } from "https://deno.land/std/http/server.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import { z } from "npm:zod";
import { helper } from "./helper.ts";`;
  const fixedCode = applyFixes(source, diagnostic.fix!);
  assertEquals(fixedCode, expectedFix);
});

Deno.test("import-order - single import", () => {
  const plugin = createImportOrderPlugin();
  const source = `import { Buffer } from "node:buffer";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("export-order - basic reordering without spacing", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: false });
  const source = `export { helper } from "./helper.ts";
export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assertEquals(diagnostic.id, "import-order/import-order");
  assertEquals(diagnostic.message, "Exports are not properly ordered");

  const expectedFix = `export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
export { helper } from "./helper.ts";`;
  const fixedCode = applyFixes(source, diagnostic.fix!);
  assertEquals(fixedCode, expectedFix);
});

Deno.test("export-order - with spacing between groups", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: true });
  const source = `export { helper } from "./helper.ts";
export { serve } from "https://deno.land/std/http/server.ts";
export { Buffer } from "node:buffer";
export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assertEquals(diagnostic.id, "import-order/import-order");

  const expectedFix = `export { Buffer } from "node:buffer";

export { serve } from "https://deno.land/std/http/server.ts";

export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";

export { helper } from "./helper.ts";`;
  const fixedCode = applyFixes(source, diagnostic.fix!);
  assertEquals(fixedCode, expectedFix);
});

Deno.test("export-order - already sorted exports", () => {
  const plugin = createImportOrderPlugin();
  const source = `export { Buffer } from "node:buffer";
export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
export { helper } from "./helper.ts";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("export-order - disable export sorting", () => {
  const plugin = createImportOrderPlugin({ sortExports: false });
  const source = `export { helper } from "./helper.ts";
export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("import-order - disable import sorting", () => {
  const plugin = createImportOrderPlugin({ sortImports: false });
  const source = `import plugin from "./import-order.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);
  assertEquals(diagnostics.length, 0);
});

Deno.test("combined - sort both imports and exports", () => {
  const plugin = createImportOrderPlugin({ spaceBetweenGroups: false });
  const source = `import { helper } from "./helper.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";

export { config } from "./config.ts";
export { z } from "npm:zod";`;

  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 2);
  assertEquals(diagnostics[0].message, "Imports are not properly ordered");
  assertEquals(diagnostics[1].message, "Exports are not properly ordered");
});

function applyFixes(source: string, fixes: Deno.lint.Fix[]): string {
  const sortedFixes = [...fixes].sort((a, b) => b.range[0] - a.range[0]);

  let result = source;
  for (const fix of sortedFixes) {
    const [start, end] = fix.range;
    result = result.slice(0, start) + fix.text + result.slice(end);
  }

  return result;
}
