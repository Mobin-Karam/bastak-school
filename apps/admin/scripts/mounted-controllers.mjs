import ts from "typescript";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Follow application module composition; dormant source files are not HTTP endpoints. */
export function mountedControllers(entrypoint) {
  const visited = new Set();
  const controllers = new Map();
  function localFile(file, specifier) {
    const base = resolve(dirname(file), specifier);
    return [base + ".ts", resolve(base, "index.ts")].find(existsSync);
  }
  function visit(file) {
    if (!file || visited.has(file)) return;
    visited.add(file);
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const names = new Set();
    function findControllers(node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "controllers") {
        if (!ts.isArrayLiteralExpression(node.initializer))
          throw new Error(`Unsupported dynamic controller registration in ${file}`);
        for (const element of node.initializer.elements) names.add(element.getText(source));
      }
      ts.forEachChild(node, findControllers);
    }
    findControllers(source);
    for (const node of source.statements) {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.startsWith(".")
      ) {
        const bindings = node.importClause?.namedBindings;
        const imports = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
        const target = localFile(file, node.moduleSpecifier.text);
        const registered = imports.filter((binding) => names.has(binding.name.text));
        if (registered.length) {
          if (!target) throw new Error(`Cannot resolve mounted controller in ${file}`);
          const classes = controllers.get(target) ?? new Set();
          for (const binding of registered)
            classes.add(binding.propertyName?.text ?? binding.name.text);
          controllers.set(target, classes);
        }
        if (imports.some((binding) => binding.name.text.endsWith("Module"))) visit(target);
      }
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.includes(".module")
      )
        visit(localFile(file, node.moduleSpecifier.text));
    }
  }
  visit(resolve(entrypoint));
  return controllers;
}
