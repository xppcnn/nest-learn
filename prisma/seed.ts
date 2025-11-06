import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据...');

  // 清空现有数据
  await prisma.cat.deleteMany();

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

