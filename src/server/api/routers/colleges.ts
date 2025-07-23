import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";

export const collegesRouter = createTRPCRouter({
  getAllCutoffs: publicProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 10;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const total = await db.cutoff.count();
      const cutoffs = await db.cutoff.findMany({
        skip,
        take,
        include: {
          stage: true,
        },
      });

      return {
        results: cutoffs,
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
});
