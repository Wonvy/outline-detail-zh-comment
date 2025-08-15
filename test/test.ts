// 这是一个测试文件，用于演示插件功能

// 用户登录函数
function loginUser(username: string, password: string): boolean {
  // 验证用户凭据
  return true;
}

// 获取用户信息
const getUserInfo = (userId: number) => {
  // 从数据库获取用户信息
  return { id: userId, name: '测试用户' };
};

// 计算订单总价
const calculateOrderTotal = (items: any[]) => {
  // 计算商品总价
  return items.reduce((total, item) => total + item.price, 0);
};

/**
 * 用户类
 * 用于管理用户相关操作
 */
class User {
  // 用户ID
  private id: number;
  
  // 用户名
  private name: string;

  // 构造函数
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  // 获取用户信息
  getUserInfo() {
    return { id: this.id, name: this.name };
  }

  // 更新用户信息
  updateUserInfo(newName: string) {
    this.name = newName;
  }
}

// 订单接口
interface Order {
  // 订单ID
  id: number;
  // 订单状态
  status: string;
}

// 处理订单
const processOrder = (order: Order) => {
  // 处理订单逻辑
  console.log('处理订单:', order.id);
};

// 导出函数
export const exportedFunction = () => {
  // 导出的函数
  return 'exported';
}; 