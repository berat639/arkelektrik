import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
      <h1 className="text-5xl sm:text-6xl font-bold mb-3 sm:mb-4">404</h1>
      <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
        Aradığınız sayfa bulunamadı.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
