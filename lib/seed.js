import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const raw = await fs.readFile('./lib/cutoff_data.json', 'utf-8');
  const data = JSON.parse(raw);

  console.log(`🚀 Seeding started. Total colleges: ${data.length}`);

  let totalCourses = 0;
  let totalStages = 0;
  let totalCutoffs = 0;

  for (const [collegeIndex, college] of data.entries()) {
    const { collegeName, collegeCode, courses } = college;

    // Upsert College
    const createdCollege = await prisma.college.upsert({
      where: { code: collegeCode },
      update: {},
      create: {
        name: collegeName,
        code: collegeCode,
      },
    });

    console.log(`🏫 (${collegeIndex + 1}/${data.length}) College: ${collegeName}`);

    for (const course of courses) {
      const createdCourse = await prisma.course.create({
        data: {
          name: course.courseName,
          choiceCode: course.choiceCode,
          capRound: course.capRound,
          collegeId: createdCollege.id,
        },
      });

      totalCourses++;

      for (const stage of course.stages) {
        const createdStage = await prisma.stage.create({
          data: {
            name: stage.stage,
            courseId: createdCourse.id,
          },
        });

        totalStages++;

        const cutoffEntries = Object.entries(stage.categories).map(([category, values]) => ({
          category,
          rank: values.rank,
          percent: values.percent,
          stageId: createdStage.id,
        }));

        // Batch insert cutoffs (safe)
        const batchSize = 25;
        for (let i = 0; i < cutoffEntries.length; i += batchSize) {
          const batch = cutoffEntries.slice(i, i + batchSize);
          await prisma.cutoff.createMany({
            data: batch,
            skipDuplicates: true,
          });
          totalCutoffs += batch.length;
        }
      }
    }
  }

  console.log('\n✅ Seeding completed!');
  console.log(`📊 Colleges: ${data.length}`);
  console.log(`📚 Courses: ${totalCourses}`);
  console.log(`🧩 Stages: ${totalStages}`);
  console.log(`🎯 Cutoffs: ${totalCutoffs}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
