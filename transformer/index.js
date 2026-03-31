"use strict";

const ts = require("typescript");

const TYPE_MAP = {
  [ts.SyntaxKind.NumberKeyword]: "Number",
  [ts.SyntaxKind.StringKeyword]: "String",
  [ts.SyntaxKind.BooleanKeyword]: "Boolean",
  [ts.SyntaxKind.VoidKeyword]: "Object",
  [ts.SyntaxKind.UndefinedKeyword]: "Object",
  [ts.SyntaxKind.NullKeyword]: "Object",
  [ts.SyntaxKind.AnyKeyword]: "Object",
  [ts.SyntaxKind.UnknownKeyword]: "Object",
  [ts.SyntaxKind.NeverKeyword]: "Object",
  [ts.SyntaxKind.ObjectKeyword]: "Object",
  [ts.SyntaxKind.SymbolKeyword]: "Object",
  [ts.SyntaxKind.BigIntKeyword]: "Object",
};

function resolveDesignType(typeNode) {
  if (!typeNode) return "Object";

  const mapped = TYPE_MAP[typeNode.kind];
  if (mapped) return mapped;

  if (ts.isArrayTypeNode(typeNode)) return "Array";

  if (ts.isTypeReferenceNode(typeNode)) {
    const name = ts.isIdentifier(typeNode.typeName) ? typeNode.typeName.text : "";
    if (name === "Array") return "Array";
    return "Object";
  }

  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) return "Object";

  return "Object";
}

function isAttributeDecorator(decorator, checker) {
  if (!ts.isCallExpression(decorator.expression)) return false;

  const expr = decorator.expression.expression;
  let symbol = checker.getSymbolAtLocation(expr);
  if (!symbol) return false;

  // Resolve aliases (import { Attribute as AttributeDecorator })
  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }

  return symbol.getName() === "Attribute";
}

/**
 * TypeScript transformer that injects __type into @Attribute() decorator calls.
 *
 * This replaces the need for `emitDecoratorMetadata` and `reflect-metadata`.
 * The transformer reads the TypeScript type annotation at compile time and
 * passes it as a runtime value to the decorator.
 *
 * Usage in tsconfig.json (requires ts-patch):
 * {
 *   "compilerOptions": {
 *     "plugins": [
 *       { "transform": "@serverless-seoul/dynamorm/transformer" }
 *     ]
 *   }
 * }
 */
function transformer(program) {
  const checker = program.getTypeChecker();

  return (context) => {
    const { factory } = context;

    return (sourceFile) => {
      function visit(node) {
        if (!ts.isPropertyDeclaration(node)) {
          return ts.visitEachChild(node, visit, context);
        }

        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        if (!decorators || decorators.length === 0) {
          return ts.visitEachChild(node, visit, context);
        }

        const attrDecIndex = decorators.findIndex((d) => isAttributeDecorator(d, checker));
        if (attrDecIndex === -1) {
          return ts.visitEachChild(node, visit, context);
        }

        const designType = resolveDesignType(node.type);
        const designTypeExpr = factory.createIdentifier(designType);

        const decorator = decorators[attrDecIndex];
        const callExpr = decorator.expression;

        // Build new argument with __type
        let newArg;
        if (callExpr.arguments.length === 0) {
          newArg = factory.createObjectLiteralExpression([
            factory.createPropertyAssignment("__type", designTypeExpr),
          ]);
        } else {
          const existing = callExpr.arguments[0];
          if (ts.isObjectLiteralExpression(existing)) {
            newArg = factory.createObjectLiteralExpression([
              ...existing.properties,
              factory.createPropertyAssignment("__type", designTypeExpr),
            ]);
          } else {
            return node;
          }
        }

        const newCallExpr = factory.updateCallExpression(
          callExpr,
          callExpr.expression,
          callExpr.typeArguments,
          [newArg]
        );

        const newDecorator = factory.updateDecorator(decorator, newCallExpr);

        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        const newDecorators = decorators.map((d, i) =>
          i === attrDecIndex ? newDecorator : d
        );

        return factory.updatePropertyDeclaration(
          node,
          [...newDecorators, ...(modifiers || [])],
          node.name,
          node.questionToken || node.exclamationToken,
          node.type,
          node.initializer
        );
      }

      return ts.visitNode(sourceFile, visit);
    };
  };
}

module.exports = transformer;
