import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          Önceki
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium opacity-50 pointer-events-none">
          Önceki
        </span>
      )}
      <span className="text-sm text-muted-foreground px-4">
        Sayfa {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          Sonraki
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium opacity-50 pointer-events-none">
          Sonraki
        </span>
      )}
    </div>
  );
}
