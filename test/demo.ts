// 这是一个完整的演示文件，展示插件的所有功能

// 基础函数声明
function basicFunction(): void {
  console.log('基础函数');
}

// 带参数的函数
function calculateSum(a: number, b: number): number {
  return a + b;
}

// 箭头函数
const arrowFunction = (x: number, y: number): number => {
  return x * y;
};

// 异步函数
async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

/**
 * 用户管理类
 * 提供用户相关的所有操作
 */
class UserManager {
  // 用户列表
  private users: User[] = [];

  // 添加新用户
  addUser(user: User): void {
    this.users.push(user);
  }

  // 根据ID查找用户
  findUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  // 删除用户
  removeUser(id: number): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

// 用户接口定义
interface User {
  // 用户唯一标识
  id: number;
  // 用户显示名称
  name: string;
  // 用户邮箱地址
  email: string;
}

// 订单状态枚举
enum OrderStatus {
  // 待处理
  PENDING = 'pending',
  // 处理中
  PROCESSING = 'processing',
  // 已完成
  COMPLETED = 'completed',
  // 已取消
  CANCELLED = 'cancelled'
}

// 订单类型别名
type OrderId = string;

// 订单处理函数
const processOrder = (orderId: OrderId, status: OrderStatus): void => {
  console.log(`处理订单 ${orderId}，状态: ${status}`);
};

// 工具函数
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};

// 导出常量
export const API_BASE_URL = 'https://api.example.com';

// 导出函数
export function exportedFunction(): string {
  return '这是一个导出的函数';
}

// 默认导出
export default class DefaultClass {
  // 默认类的构造函数
  constructor() {
    console.log('默认类已创建');
  }
} 