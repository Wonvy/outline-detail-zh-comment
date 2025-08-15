import * as vscode from 'vscode';
import * as ts from 'typescript';

export function activate(ctx: vscode.ExtensionContext) {
  console.log('🎉 插件已激活: Outline Detail: Chinese Comment After Name');
  
  // 创建输出通道
  const outputChannel = vscode.window.createOutputChannel('Outline Detail: Chinese Comment After Name');
  outputChannel.appendLine('🎉 插件已激活: Outline Detail: Chinese Comment After Name');
  
  // 显示激活成功消息
  vscode.window.showInformationMessage('Outline Detail 插件已激活！');
  
  const selector: vscode.DocumentSelector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' }
  ];

  const provider = vscode.languages.registerDocumentSymbolProvider(selector, {
    provideDocumentSymbols(doc: vscode.TextDocument) {
      outputChannel.appendLine(`📄 正在处理文档: ${doc.fileName}`);
      outputChannel.appendLine(`📄 文档语言: ${doc.languageId}`);
      
      try {
        const text = doc.getText();
        outputChannel.appendLine(`📄 文档长度: ${text.length} 字符`);
        
        const sf = ts.createSourceFile(doc.fileName, text, ts.ScriptTarget.Latest, true, guessScriptKind(doc.fileName));
        const out: vscode.DocumentSymbol[] = [];

        const visit = (node: ts.Node) => {
          const s = makeSymbol(node, doc, text, outputChannel);
          if (s) {
            outputChannel.appendLine(`✅ 创建符号: ${s.name} - ${s.detail}`);
            out.push(s);
          }
          ts.forEachChild(node, visit);
        };
        
        visit(sf);
        outputChannel.appendLine(`🎯 总共找到 ${out.length} 个符号`);
        return out;
      } catch (error) {
        outputChannel.appendLine(`❌ 处理文档时出错: ${error}`);
        return [];
      }
    }
  });

  ctx.subscriptions.push(provider);
  outputChannel.appendLine('✅ DocumentSymbolProvider 已注册');
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
    console.log(`找到函数声明: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.Function, fullText, outputChannel);
  }
  
  // 类方法
  if (ts.isMethodDeclaration(node) && node.name) {
    outputChannel.appendLine(`找到类方法: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.Method, fullText, outputChannel);
  }
  
  // 类声明
  if (ts.isClassDeclaration(node) && node.name) {
    outputChannel.appendLine(`找到类声明: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.Class, fullText, outputChannel);
  }
  
  // 接口声明
  if (ts.isInterfaceDeclaration(node)) {
    outputChannel.appendLine(`找到接口声明: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.Interface, fullText, outputChannel);
  }
  
  // 类型别名
  if (ts.isTypeAliasDeclaration(node)) {
    outputChannel.appendLine(`找到类型别名: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.TypeParameter, fullText, outputChannel);
  }
  
  // 枚举声明
  if (ts.isEnumDeclaration(node)) {
    outputChannel.appendLine(`找到枚举声明: ${node.name.getText()}`);
    return build(doc, node, node.name, vscode.SymbolKind.Enum, fullText, outputChannel);
  }
  
  // 变量 = 箭头函数/函数表达式
  if (ts.isVariableStatement(node)) {
    for (const d of node.declarationList.declarations) {
      if (d.name && d.initializer) {
        if (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) {
          outputChannel.appendLine(`找到箭头函数/函数表达式: ${d.name.getText()}`);
          return build(doc, d, d.name, vscode.SymbolKind.Function, fullText, outputChannel);
        }
        // 检查是否是类
        if (ts.isClassExpression(d.initializer)) {
          outputChannel.appendLine(`找到类表达式: ${d.name.getText()}`);
          return build(doc, node, d.name, vscode.SymbolKind.Class, fullText, outputChannel);
        }
      }
    }
  }
  
  // 导出声明
  if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
    for (const specifier of node.exportClause.elements) {
      outputChannel.appendLine(`找到导出声明: ${specifier.name.getText()}`);
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
  
  const ds = new vscode.DocumentSymbol(originalName, comment, kind, range, sel);
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
  console.log(`检查字符串 "${s}" 是否包含中文: ${result}`);
  return result;
}

export function deactivate() {}
