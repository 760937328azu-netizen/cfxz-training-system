import { prisma } from "./src/lib/prisma";

async function check() {
  const admins = await prisma.adminUser.count();
  const questions = await prisma.questionBank.count();
  const qb = await prisma.questionBank.findFirst();

  console.log("管理员数量:", admins);
  console.log("题库版本数量:", questions);

  if (qb) {
    const qs = qb.questions as any[];
    console.log("题库版本:", qb.version);
    console.log("题目数量:", qs.length);
    console.log("前3题预览:");
    qs.slice(0, 3).forEach((q: any, i: number) =>
      console.log("  " + (i + 1) + ". " + q.question.substring(0, 40) + "...")
    );
  }

  console.log("---ALL OK---");
  await prisma.$disconnect();
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
