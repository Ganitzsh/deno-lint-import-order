# deno-lint-import-order

This is a Deno lint plugin to ordering your import statements.

All imports should occurred by following order:

- Builtin imports
- Http imports
- External imports
- Local imports

## Install

Add this in your `deno.json`:

```json
{
  "lint": {
    "plugins": [
      "jsr:@ayk/lint-import-order"
    ]
  }
}
```

## Usage

Run `deno lint` or `deno lint --fix` with quick fix.

## Example

### Good

```ts
import fs from "node:fs";
import React from "https://esm.sh/react@17.0.2";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import { hi } from "./hi.ts";
```

### Bad

```ts
import { hi } from "./hi.ts";
import { FetchaBuilder } from "jsr:@kiritaniayaka/fetcha";
import React from "https://esm.sh/react@17.0.2";
import fs from "node:fs";
```
