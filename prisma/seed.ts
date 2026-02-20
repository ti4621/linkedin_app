import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaults = ["Tim", "Alex"];
  for (const name of defaults) {
    await prisma.player.upsert({
      where: { nameKey: name.toLowerCase() },
      update: { name },
      create: { name, nameKey: name.toLowerCase() }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
