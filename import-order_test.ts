import { assertEquals } from "jsr:@std/assert";
import plugin from "./import-order.ts";

Deno.test("import-order", () => {
  const source = `import plugin from "./import-order.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";`;
  const diagnostics = Deno.lint.runPlugin(plugin, "main.ts", source);

  assertEquals(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assertEquals(diagnostic.id, "import-order/import-order");
  assertEquals(diagnostic.message, "The imports are not ordered");
  assertEquals(
    diagnostic.hint,
    "All imports should be ordered by type (built-in, http, external, local) and alphabetically. It could be fix by running with --fix",
  );
});
