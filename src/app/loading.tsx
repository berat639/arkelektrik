import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 sm:h-9 w-36 sm:w-48 mb-2" />
        <Skeleton className="h-4 sm:h-5 w-56 sm:w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-32 sm:h-40 w-full rounded" />
            <Skeleton className="h-4 sm:h-5 w-20" />
            <Skeleton className="h-5 sm:h-6 w-full" />
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-3 sm:h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
