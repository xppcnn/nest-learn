import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据...');

  // 清空现有数据（注意关联顺序）
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cat.deleteMany();

  // 创建基础角色
  const [superAdminRole, userRole] = await Promise.all([
    prisma.role.create({
      data: {
        code: 'super-admin',
        name: '超级管理员',
        description: '拥有所有系统权限',
        isSystem: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'user',
        name: '普通用户',
        description: '默认基础权限',
        isSystem: true,
      },
    }),
  ]);

  // 创建示例用户
  const [adminUser, demoUser] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin@123',
      },
    }),
    prisma.user.create({
      data: {
        username: 'demo',
        email: 'demo@example.com',
        password: 'Demo@123',
      },
    }),
  ]);

  // 关联用户角色
  await prisma.userRole.createMany({
    data: [
      {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
      {
        userId: demoUser.id,
        roleId: userRole.id,
      },
    ],
  });

  // 创建示例猫咪数据
  const cats = await prisma.cat.createMany({
    data: [
      {
        name: 'Whiskers',
        age: 3,
        breed: 'Persian',
        description: 'A fluffy white cat',
      },
      {
        name: 'Shadow',
        age: 5,
        breed: 'British Shorthair',
        description: 'A grey cat that loves to play',
      },
      {
        name: 'Luna',
        age: 2,
        breed: 'Siamese',
        description: 'An elegant and vocal cat',
      },
      {
        name: 'Mittens',
        age: 4,
        breed: 'Maine Coon',
        description: 'A large and friendly cat',
      },
    ],
  });

  console.log(`✅ 已创建 ${cats.count} 只猫咪`);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

