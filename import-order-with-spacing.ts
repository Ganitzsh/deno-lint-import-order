import { createImportOrderPlugin } from "./import-order.ts";

export default createImportOrderPlugin({
  sortImports: true,
  sortExports: true,
  spaceBetweenGroups: true,
});
