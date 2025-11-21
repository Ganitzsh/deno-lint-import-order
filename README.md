# deno-lint-import-order

A Deno lint plugin that automatically orders your import statements by type and
alphabetically.

## Features

- Automatically categorizes imports and exports into 4 groups:
  - Built-in (node:\*)
  - HTTP (http://, https://)
  - External (jsr:, npm:, and bare specifiers)
  - Local (., /)
- Sorts imports and exports alphabetically within each group
- Configurable import sorting (enable/disable)
- Configurable export sorting (enable/disable)
- Configurable spacing between groups
- Auto-fix support with `--fix` flag

## Installation

Add this to your `deno.json`:

```json
{
  "lint": {
    "plugins": ["jsr:@ayk/lint-import-order"]
  }
}
```

## Usage

Run the linter:

```bash
deno lint
```

Automatically fix import order:

```bash
deno lint --fix
```

## Configuration

### Options

The plugin supports three configuration options:

| Option               | Type      | Default | Description                                  |
| -------------------- | --------- | ------- | -------------------------------------------- |
| `sortImports`        | `boolean` | `true`  | Enable/disable import sorting                |
| `sortExports`        | `boolean` | `true`  | Enable/disable export sorting                |
| `spaceBetweenGroups` | `boolean` | `false` | Add blank lines between import/export groups |

> **Note:** Deno's lint plugin API does not support passing configuration options
> directly through `deno.json`. You must use one of the approaches below to
> configure the plugin.

### Default Configuration

By default, both imports and exports are sorted without spacing:

```json
{
  "lint": {
    "plugins": ["jsr:@ayk/lint-import-order"]
  }
}
```

### Using Pre-configured Exports

The plugin provides pre-configured exports for common use cases:

**With spacing between groups:**

```json
{
  "lint": {
    "plugins": ["jsr:@ayk/lint-import-order/with-spacing"]
  }
}
```

Or import the named export:

```typescript
export { importOrderWithSpacing as default } from "jsr:@ayk/lint-import-order";
```

**Sort imports only:**

```json
{
  "lint": {
    "plugins": ["jsr:@ayk/lint-import-order/imports-only"]
  }
}
```

**Sort exports only:**

```json
{
  "lint": {
    "plugins": ["jsr:@ayk/lint-import-order/exports-only"]
  }
}
```

### Custom Configuration

For full control, create a configuration file:

```typescript
import { createImportOrderPlugin } from "jsr:@ayk/lint-import-order";

export default createImportOrderPlugin({
  sortImports: true,
  sortExports: true,
  spaceBetweenGroups: true,
});
```

Then reference it in your `deno.json`:

```json
{
  "lint": {
    "plugins": ["./lint-plugins/import-order-config.ts"]
  }
}
```

### Configuration Examples

**Only sort imports (skip exports):**

```typescript
export default createImportOrderPlugin({
  sortImports: true,
  sortExports: false,
});
```

**Only sort exports (skip imports):**

```typescript
export default createImportOrderPlugin({
  sortImports: false,
  sortExports: true,
});
```

**Sort both with spacing:**

```typescript
export default createImportOrderPlugin({
  sortImports: true,
  sortExports: true,
  spaceBetweenGroups: true,
});
```

## Examples

### Imports - Without spacing (default)

```typescript
import { Buffer } from "node:buffer";
import { serve } from "https://deno.land/std/http/server.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import { z } from "npm:zod";
import { helper } from "./helper.ts";
```

### Imports - With spacing

```typescript
import { Buffer } from "node:buffer";

import { serve } from "https://deno.land/std/http/server.ts";

import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import { z } from "npm:zod";

import { helper } from "./helper.ts";
```

### Exports - Without spacing (default)

```typescript
export { Buffer } from "node:buffer";
export { serve } from "https://deno.land/std/http/server.ts";
export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
export { z } from "npm:zod";
export { helper } from "./helper.ts";
```

### Exports - With spacing

```typescript
export { Buffer } from "node:buffer";

export { serve } from "https://deno.land/std/http/server.ts";

export { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
export { z } from "npm:zod";

export { helper } from "./helper.ts";
```

## Development

### Testing the plugin locally

To test this plugin in your project without publishing to JSR:

1. Clone this repository:

```bash
git clone https://github.com/yourusername/deno-lint-import-order.git
cd deno-lint-import-order
```

2. In your project's `deno.json`, use a file path to reference the plugin:

```json
{
  "lint": {
    "plugins": ["../path/to/deno-lint-import-order/import-order.ts"]
  }
}
```

Or use an absolute path:

```json
{
  "lint": {
    "plugins": [
      "file:///Users/username/dev/deno-lint-import-order/import-order.ts"
    ]
  }
}
```

3. Run the linter in your project:

```bash
deno lint
```

### Running tests

```bash
deno test
```

### Linting the plugin itself

```bash
deno lint
```

### Creating a custom configuration

You can create your own configuration file to test different settings:

```typescript
import { createImportOrderPlugin } from "./import-order.ts";

export default createImportOrderPlugin({
  spaceBetweenGroups: true,
});
```

Then use it in your test project:

```json
{
  "lint": {
    "plugins": ["../path/to/deno-lint-import-order/my-custom-config.ts"]
  }
}
```

## License

MIT
