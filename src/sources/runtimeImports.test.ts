import * as ts from 'typescript'
import { describe, expect, it } from 'vitest'
import apiSource from '../../api/fixtures.ts?raw'
import serverSource from './footballServer.ts?raw'

function runtimeRelativeImports(source: string, fileName: string): string[] {
  const imports: string[] = []
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  function addSpecifier(specifier: ts.Expression | undefined) {
    if (specifier && ts.isStringLiteral(specifier) && /^\.{1,2}\//.test(specifier.text)) {
      imports.push(specifier.text)
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
      addSpecifier(node.moduleSpecifier)
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      addSpecifier(node.moduleSpecifier)
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      addSpecifier(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return imports
}

describe('Node ESM runtime imports', () => {
  it.each([
    ['api/fixtures.ts', apiSource],
    ['src/sources/footballServer.ts', serverSource],
  ])('%s uses .js on every runtime relative import', (fileName, source) => {
    const imports = runtimeRelativeImports(source, fileName)
    expect(imports.length).toBeGreaterThan(0)
    expect(imports.every((specifier) => specifier.endsWith('.js'))).toBe(true)
  })
})
