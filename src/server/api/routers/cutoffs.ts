// server/api/routers/cutoff.ts

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";

export const cutoffRouter = createTRPCRouter({
    getCutoffsByQuery: publicProcedure
        .input(
            z.object({
                query: z.string().optional(),
                courses: z.string().array().optional(),
                category: z.string().optional(),
                percent: z.number().optional(),
                page: z.number().optional(),
                pageSize: z.number().optional(),
            })
        )
        .query(async ({ input }) => {
            const { query, courses, category, percent } = input;
            const page = input.page ?? 1;
            const pageSize = input.pageSize ?? 10;
            const skip = (page - 1) * pageSize;
            const take = pageSize;
            const normalizedQuery = query?.toLowerCase();

            // Get total count for pagination
            const total = await db.college.count({
                where: query
                    ? {
                        OR: [
                            { name: { contains: normalizedQuery } },
                            { code: { contains: normalizedQuery } },
                        ],
                    }
                    : undefined,
            });

            const colleges = await db.college.findMany({
                where: query
                    ? {
                        OR: [
                            { name: { contains: normalizedQuery } },
                            { code: { contains: normalizedQuery } },
                        ],
                    }
                    : undefined,
                include: {
                    courses: {
                        include: {
                            stages: {
                                include: {
                                    cutoffs: true,
                                },
                            },
                            college: {
                                include: {
                                    courses: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take,
            });

            const allCourses = colleges.flatMap((c: typeof colleges[number]) => c.courses ?? []);

            const filteredCourses = courses && courses.length > 0
                ? allCourses.filter(
                    (c) =>
                        courses.some(
                            (course) =>
                                (c.name?.toLowerCase?.().includes(course.toLowerCase()) ?? false) ||
                                c.choiceCode === course
                        )
                )
                : allCourses;

            const results: {
                collegeName: string;
                courseName: string;
                capRound: string;
                stage: string;
                category: string;
                requiredPercent: number;
                yourPercent?: number;
                eligible: boolean;
            }[] = [];

            for (const course of filteredCourses) {
                for (const stage of course.stages ?? []) {
                    const stageCutoffs = category
                        ? (stage.cutoffs ?? []).filter((c: { category: string }) => c.category === category)
                        : stage.cutoffs ?? [];

                    for (const cutoff of stageCutoffs) {
                        const isEligible =
                            percent !== undefined ? percent >= cutoff.percent : false;

                        results.push({
                            collegeName:
                                colleges.find((col: typeof colleges[number]) => col.id === course.collegeId)?.name ??
                                "Unknown",
                            courseName: course.name ?? "Unknown",
                            capRound: course.capRound ?? "Unknown",
                            stage: stage.name ?? "Unknown",
                            category: cutoff.category ?? "Unknown",
                            requiredPercent: cutoff.percent ?? 0,
                            yourPercent: percent,
                            eligible: isEligible,
                        });
                    }
                }
            }

            return {
                results,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                    hasNextPage: page < Math.ceil(total / pageSize),
                    hasPreviousPage: page > 1,
                },
            };
        }),
    getAllCourses: publicProcedure.query(async () => {
        const courses = await db.course.findMany({
            select: { name: true },
            distinct: ['name'],
        });
        return courses.map(c => c.name).filter(Boolean);
    }),
});