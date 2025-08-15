# Outline Detail: Chinese Comment After Name

这是一个 VS Code 插件，用于在代码地图（Outline）中显示函数名后的中文注释。

## 功能特性

- 在代码地图中显示函数、类、接口等符号的中文注释
- 支持单行注释 (`//`) 和 JSDoc 注释 (`/** */`)
- 自动识别中文注释内容
- 支持 TypeScript 和 JavaScript 文件
- 支持 React 文件 (.tsx, .jsx)

## 支持的注释格式

### 单行注释
```typescript
// 用户登录函数
function loginUser(username: string, password: string): boolean {
  return true;
}
```

### JSDoc 注释
```typescript
/**
 * 用户类
 * 用于管理用户相关操作
 */
class User {
  // 用户ID
  private id: number;
}
```

## 支持的符号类型

- 函数声明 (`function`)
- 箭头函数 (`const func = () => {}`)
- 类声明 (`class`)
- 类方法 (`method`)
- 接口声明 (`interface`)
- 类型别名 (`type`)
- 枚举声明 (`enum`)
- 导出声明 (`export`)

## 安装和使用

1. 克隆或下载此项目
2. 在项目根目录运行 `npm install` 安装依赖
3. 运行 `npm run compile` 编译插件
4. 在 VS Code 中按 `F5` 启动调试模式，或使用 `vsce package` 打包插件

## 开发

```bash
# 安装依赖
npm install

# 编译插件
npm run compile

# 监听文件变化并自动编译
npm run watch
```

## 测试

打开 `test/test.ts` 文件，在 VS Code 中查看代码地图（Outline），你应该能看到函数名后面显示的中文注释。

## 注意事项

- 注释必须包含中文字符才会被显示
- 单行注释必须紧邻函数声明（中间不能有空行或其他代码）
- JSDoc 注释会取第一行不包含 `@` 标记的内容
- 插件会自动处理多行注释和连续注释

## 许可证

MIT 