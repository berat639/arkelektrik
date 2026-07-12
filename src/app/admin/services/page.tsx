import Link from "next/link";
import { getAllServicePages } from "@/lib/db";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ServicesAdminClient } from "@/components/admin/services-admin-client";

export default async function AdminServicesPage() {
  const services = await getAllServicePages();

  return (
    <ServicesAdminClient>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Sıra</th>
              <th className="px-4 py-3 text-left font-medium">Başlık</th>
              <th className="px-4 py-3 text-left font-medium">Son Güncelleme</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">{service.order}</td>
                <td className="px-4 py-3 font-medium">{service.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(service.updated_at), "d MMM yyyy", {
                    locale: tr,
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/services/${service.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ServicesAdminClient>
  );
}
