// Preserve ESM file-relative package loading when Jest transforms Nest to CJS.
module.exports = ({ types: t }) => ({
  visitor: {
    Program(path) {
      if (path.scope.hasOwnBinding("require")) path.scope.rename("require", "esmRequire");
    },
    MemberExpression(path) {
      const node = path.node;
      if (
        t.isMetaProperty(node.object) &&
        node.object.meta.name === "import" &&
        node.object.property.name === "meta" &&
        t.isIdentifier(node.property, { name: "url" })
      ) {
        path.replaceWith(
          t.memberExpression(
            t.callExpression(
              t.memberExpression(
                t.callExpression(t.identifier("require"), [t.stringLiteral("node:url")]),
                t.identifier("pathToFileURL")
              ),
              [t.identifier("__filename")]
            ),
            t.identifier("href")
          )
        );
      }
    }
  }
});
