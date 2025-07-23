import { HydrateClient } from "~/trpc/server";
import { DataTableDemo } from "./_components/Table";
import { Hero } from "./_components/Hero";

export default async function Home() {

  return (
    <HydrateClient>
      <main className="min-h-screen bg-background">
        <Hero />
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl font-bold mt-6 text-primary">Cutoff Data</h1>
          <div className="w-full max-w-7xl mx-auto px-4" id="cutoff-data">
            <DataTableDemo />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
