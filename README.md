# Outline Chinese Comments

一个 VS Code 插件，在自带的大纲视图中显示中文注释，支持层级结构和缩进显示。

## ✨ 功能特性

- 🎯 **自带大纲集成** - 在 VS Code 自带的大纲中显示中文注释
- 🌳 **层级结构支持** - 保留函数和类的层级关系，支持缩进显示
- 💬 **中文注释识别** - 自动识别单行注释和 JSDoc 注释中的中文内容
- 🖱️ **悬停提示** - 鼠标悬停时显示中文注释和类型信息
- 👁️ **代码镜头** - 在代码上方显示中文注释
- 🔧 **多语言支持** - 支持 TypeScript、JavaScript、TSX、JSX

## 🚀 安装方法

### 方法一：从 VSIX 安装
1. 下载 `outline-zh-comments-0.0.1.vsix` 文件
2. 在 VS Code 中按 `Ctrl+Shift+P`
3. 输入 "Extensions: Install from VSIX..."
4. 选择下载的 VSIX 文件

### 方法二：从源码编译
```bash
git clone https://github.com/wonvy/outline-zh-comments.git
cd outline-zh-comments
npm install
npm run compile
npx vsce package
```

## 📝 使用方法

### 支持的注释格式

#### 单行注释
```typescript
// 这是一个测试函数
function testFunction() {
    return 'Hello World';
}
```

#### JSDoc 注释
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

### 支持的代码结构

- ✅ 函数声明和方法
- ✅ 类和接口
- ✅ 类型别名和枚举
- ✅ 箭头函数和类表达式
- ✅ 导出声明

## 🎨 界面效果

安装插件后，您将在 VS Code 自带的大纲中看到：

```
📄 SimpleClass (这是一个简单的测试类)
  simpleMethod (这是一个简单的方法)
📄 simpleFunction1 (这是一个测试函数)
📄 simpleFunction2 (另一个测试函数)
```

## 🔧 配置选项

插件无需额外配置，安装后即可使用。

## 📋 系统要求

- VS Code 1.80.0 或更高版本
- 支持 TypeScript、JavaScript、TSX、JSX 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

**Wonvy** - [GitHub](https://github.com/wonvy)

---

如果这个插件对您有帮助，请给个 ⭐ 支持一下！ 