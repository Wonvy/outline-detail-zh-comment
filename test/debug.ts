// 这是第一个测试函数
function firstFunction() {
  return 'first';
}

// 这是第二个测试函数
const secondFunction = () => {
  return 'second';
};

// 这是第三个测试函数
async function thirdFunction() {
  return 'third';
}

/**
 * 这是JSDoc注释的测试函数
 * 应该能正确提取中文注释
 */
function jsdocFunction() {
  return 'jsdoc';
}

// 这是最后一个测试函数
export function exportedFunction() {
  return 'exported';
} 