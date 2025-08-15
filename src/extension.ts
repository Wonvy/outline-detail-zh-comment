import * as vscode from 'vscode';
import * as ts from 'typescript';

export function activate(ctx: vscode.ExtensionContext) {
  // 强制显示激活消息
  vscode.window.showInformationMessage('🎉 Outline 中文注释插件已激活！');
  
  // 在控制台输出激活信息
  console.log('🎉 插件已激活: Outline 中文注释');
  
  // 创建输出通道
  const outputChannel = vscode.window.createOutputChannel('Outline 中文注释');
  outputChannel.appendLine('🎉 插件已激活: Outline 中文注释');
  
  // 强制显示输出通道
  outputChannel.show();
  
  const selector: vscode.DocumentSelector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' }
  ];

  // 注册 DocumentSymbolProvider 来增强自带的大纲视图，支持层级结构
  const provider = vscode.languages.registerDocumentSymbolProvider(selector, {
    provideDocumentSymbols(doc: vscode.TextDocument) {
      outputChannel.appendLine(`📄 正在处理文档: ${doc.fileName}`);
      
      try {
        const text = doc.getText();
        const sf = ts.createSourceFile(doc.fileName, text, ts.ScriptTarget.Latest, true, guessScriptKind(doc.fileName));
        const out: vscode.DocumentSymbol[] = [];

        // 使用递归方式构建层级结构
        const visit = (node: ts.Node, parentSymbol?: vscode.DocumentSymbol) => {
          const symbol = makeSymbol(node, doc, text, outputChannel);
          if (symbol) {
            outputChannel.appendLine(`✅ 创建符号: ${symbol.name}`);
            
            if (parentSymbol) {
              // 如果有父级符号，添加到父级的 children 中
              parentSymbol.children = parentSymbol.children || [];
              parentSymbol.children.push(symbol);
              outputChannel.appendLine(`📁 将 ${symbol.name} 添加到 ${parentSymbol.name} 的子级`);
            } else {
              // 顶级符号直接添加到输出数组
              out.push(symbol);
            }
            
            // 递归处理子节点，传递当前符号作为父级
            ts.forEachChild(node, (child) => visit(child, symbol));
          } else {
            // 如果没有创建符号，但仍然需要递归处理子节点
            ts.forEachChild(node, (child) => visit(child, parentSymbol));
          }
        };
        
        visit(sf);
        outputChannel.appendLine(`🎯 总共找到 ${out.length} 个顶级符号`);
        return out;
      } catch (error) {
        outputChannel.appendLine(`❌ 处理文档时出错: ${error}`);
        return [];
      }
    }
  });

  // 注册 HoverProvider 来在悬停时显示中文注释
  const hoverProvider = vscode.languages.registerHoverProvider(selector, {
    provideHover(document, position, token) {
      try {
        const text = document.getText();
        const sf = ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true, guessScriptKind(document.fileName));
        
        // 找到当前位置的节点
        const node = findNodeAtPosition(sf, position, document);
        if (!node) return null;
        
        const comment = extractChineseLineAbove(document, node, outputChannel) || extractChineseJSDoc(node, text, outputChannel);
        if (comment) {
          return new vscode.Hover([
            `**中文注释:** ${comment}`,
            `**类型:** ${getNodeType(node)}`
          ]);
        }
      } catch (error) {
        outputChannel.appendLine(`❌ Hover 提供者出错: ${error}`);
      }
      return null;
    }
  });

  // 注册 CodeLensProvider 来在代码上方显示中文注释
  const codeLensProvider = vscode.languages.registerCodeLensProvider(selector, {
    provideCodeLenses(document, token) {
      try {
        const text = document.getText();
        const sf = ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true, guessScriptKind(document.fileName));
        const lenses: vscode.CodeLens[] = [];

        const visit = (node: ts.Node) => {
          if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isClassDeclaration(node)) {
            const comment = extractChineseLineAbove(document, node, outputChannel) || extractChineseJSDoc(node, text, outputChannel);
            if (comment) {
              const range = new vscode.Range(
                document.positionAt(node.getStart()),
                document.positionAt(node.getEnd())
              );
              lenses.push(new vscode.CodeLens(range, {
                title: `💬 ${comment}`,
                command: ''
              }));
            }
          }
          ts.forEachChild(node, visit);
        };
        
        visit(sf);
        return lenses;
      } catch (error) {
        outputChannel.appendLine(`❌ CodeLens 提供者出错: ${error}`);
        return [];
      }
    }
  });

  ctx.subscriptions.push(provider, hoverProvider, codeLensProvider);
  outputChannel.appendLine('✅ 所有提供者已注册');
  
  // 显示激活成功消息
  vscode.window.showInformationMessage('✅ 中文注释插件已集成到自带大纲中，支持层级结构！');
}

function guessScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.ts')) return ts.ScriptKind.TS;
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

function makeSymbol(node: ts.Node, doc: vscode.TextDocument, fullText: string, outputChannel: vscode.OutputChannel): vscode.DocumentSymbol | null {
  // 函数声明
  if (ts.isFunctionDeclaration(node) && node.name) {
    return build(doc, node, node.name, vscode.SymbolKind.Function, fullText, outputChannel);
  }
  
  // 类方法
  if (ts.isMethodDeclaration(node) && node.name) {
    return build(doc, node, node.name, vscode.SymbolKind.Method, fullText, outputChannel);
  }
  
  // 类声明
  if (ts.isClassDeclaration(node) && node.name) {
    return build(doc, node, node.name, vscode.SymbolKind.Class, fullText, outputChannel);
  }
  
  // 接口声明
  if (ts.isInterfaceDeclaration(node)) {
    return build(doc, node, node.name, vscode.SymbolKind.Interface, fullText, outputChannel);
  }
  
  // 类型别名
  if (ts.isTypeAliasDeclaration(node)) {
    return build(doc, node, node.name, vscode.SymbolKind.TypeParameter, fullText, outputChannel);
  }
  
  // 枚举声明
  if (ts.isEnumDeclaration(node)) {
    return build(doc, node, node.name, vscode.SymbolKind.Enum, fullText, outputChannel);
  }
  
  // 变量 = 箭头函数/函数表达式
  if (ts.isVariableStatement(node)) {
    for (const d of node.declarationList.declarations) {
      if (d.name && d.initializer) {
        if (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) {
          return build(doc, d, d.name, vscode.SymbolKind.Function, fullText, outputChannel);
        }
        // 检查是否是类
        if (ts.isClassExpression(d.initializer)) {
          return build(doc, node, d.name, vscode.SymbolKind.Class, fullText, outputChannel);
        }
      }
    }
  }
  
  // 导出声明
  if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
    for (const specifier of node.exportClause.elements) {
      return build(doc, node, specifier.name, vscode.SymbolKind.Variable, fullText, outputChannel);
    }
  }
  
  return null;
}

function build(
  doc: vscode.TextDocument,
  node: ts.Node,
  nameNode: ts.Node,
  kind: vscode.SymbolKind,
  fullText: string,
  outputChannel: vscode.OutputChannel
) {
  const originalName = nameNode.getText();
  const range = new vscode.Range(doc.positionAt(node.getStart()), doc.positionAt(node.getEnd()));
  const sel = new vscode.Range(doc.positionAt(nameNode.getStart()), doc.positionAt(nameNode.getEnd()));

  const comment = extractChineseLineAbove(doc, nameNode, outputChannel) || extractChineseJSDoc(node, fullText, outputChannel) || '';
  
  // 添加调试信息
  if (comment) {
    outputChannel.appendLine(`Found comment for ${originalName}: "${comment}"`);
  }
  
  // 创建 DocumentSymbol，使用原始名称，注释放在 detail 字段中
  const ds = new vscode.DocumentSymbol(originalName, comment, kind, range, sel);
  
  // 设置 detail 字段显示注释（灰字部分）
  if (comment) {
    ds.detail = comment;
    outputChannel.appendLine(`设置 detail 字段: "${comment}"`);
  }
  
  return ds;
}

/** 取紧邻上一行 // 注释（含中文），中间不能有空行或其他代码 */
function extractChineseLineAbove(doc: vscode.TextDocument, node: ts.Node, outputChannel: vscode.OutputChannel): string | undefined {
  try {
    // 对于函数声明，我们需要找到函数名的开始位置
    let startPos: vscode.Position;
    
    if (ts.isFunctionDeclaration(node) && node.name) {
      startPos = doc.positionAt(node.name.getStart());
    } else if (ts.isMethodDeclaration(node) && node.name) {
      startPos = doc.positionAt(node.name.getStart());
    } else if (ts.isVariableDeclaration(node)) {
      startPos = doc.positionAt(node.name.getStart());
    } else {
      startPos = doc.positionAt(node.getStart());
    }
    
    const prevLine = startPos.line - 1;
    outputChannel.appendLine(`🔍 检查第 ${prevLine} 行的注释，函数在第 ${startPos.line} 行`);
    
    if (prevLine < 0) {
      outputChannel.appendLine('❌ 没有上一行');
      return;
    }

    const prevText = doc.lineAt(prevLine).text.trim();
    outputChannel.appendLine(`📝 上一行内容: "${prevText}"`);
    
    if (!prevText.startsWith('//')) {
      outputChannel.appendLine('❌ 上一行不是注释');
      return;
    }

    // 简化检查逻辑，只检查紧邻的注释
    const content = prevText.replace(/^\/\/\s?/, '').trim();
    const hasChineseContent = hasChinese(content);
    outputChannel.appendLine(`💬 注释内容: "${content}", 是否包含中文: ${hasChineseContent}`);
    
    if (hasChineseContent) {
      outputChannel.appendLine(`✅ 成功提取注释: "${content}"`);
      return content;
    }
    
    return undefined;
  } catch (error) {
    outputChannel.appendLine(`❌ 提取注释时出错: ${error}`);
    return undefined;
  }
}

/** 兜底：读紧邻的 JSDoc，取第一行中文 */
function extractChineseJSDoc(node: ts.Node, fullText: string, outputChannel: vscode.OutputChannel): string | undefined {
  try {
    const ranges = ts.getLeadingCommentRanges(fullText, node.getFullStart());
    if (!ranges || ranges.length === 0) return;
    
    // 取最后一个注释范围（最接近节点的）
    const last = ranges[ranges.length - 1];
    const raw = fullText.slice(last.pos, last.end);
    
    // 检查是否是 JSDoc 注释
    if (!/^\s*\/\*\*/.test(raw)) return;

    const body = raw.replace(/^\/\*\*?|\*\/$/g, '');
    const lines = body.split(/\r?\n/).map(l => l.replace(/^\s*\*\s?/, '').trim());
    
    // 查找第一个非空且不包含 @ 标记的行
    const first = lines.find(l => l.length > 0 && !l.startsWith('@'));
    if (first && hasChinese(first)) {
      outputChannel.appendLine(`✅ 成功提取 JSDoc 注释: "${first}"`);
      return first;
    }
    outputChannel.appendLine(`❌ 未找到包含中文的 JSDoc 注释`);
    return undefined;
  } catch (error) {
    outputChannel.appendLine(`❌ 提取 JSDoc 注释时出错: ${error}`);
    return undefined;
  }
}

function hasChinese(s: string) {
  const result = /[\u4e00-\u9fa5]/.test(s);
  return result;
}

function findNodeAtPosition(sf: ts.SourceFile, position: vscode.Position, document: vscode.TextDocument): ts.Node | null {
  let result: ts.Node | null = null;
  
  const visit = (node: ts.Node) => {
    const start = document.positionAt(node.getStart());
    const end = document.positionAt(node.getEnd());
    
    if (position.isAfterOrEqual(start) && position.isBeforeOrEqual(end)) {
      if (!result || (node.getStart() <= result.getStart() && node.getEnd() >= result.getEnd())) {
        result = node;
      }
    }
    
    ts.forEachChild(node, visit);
  };
  
  visit(sf);
  return result;
}

function getNodeType(node: ts.Node): string {
  if (ts.isFunctionDeclaration(node)) return '函数声明';
  if (ts.isMethodDeclaration(node)) return '类方法';
  if (ts.isClassDeclaration(node)) return '类声明';
  if (ts.isInterfaceDeclaration(node)) return '接口声明';
  if (ts.isTypeAliasDeclaration(node)) return '类型别名';
  if (ts.isEnumDeclaration(node)) return '枚举声明';
  if (ts.isVariableStatement(node)) return '变量声明';
  return '未知类型';
}

export function deactivate() {} 