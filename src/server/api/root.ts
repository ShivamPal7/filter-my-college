
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { cutoffRouter } from "./routers/cutoffs";
import { collegesRouter } from "./routers/colleges";
import { generatePdfRouter } from "./routers/generate-pdf";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    cutoff: cutoffRouter,
    colleges: collegesRouter,
    generatePdf: generatePdfRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
