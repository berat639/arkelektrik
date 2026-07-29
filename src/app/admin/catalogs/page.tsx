import { getAllCatalogs } from "@/lib/db";
import { CatalogsAdminClient } from "@/components/admin/catalogs-admin-client";

export default async function AdminCatalogsPage() {
  const catalogs = await getAllCatalogs();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kataloglar</h1>
      <CatalogsAdminClient initialCatalogs={catalogs} />
    </div>
  );
}
