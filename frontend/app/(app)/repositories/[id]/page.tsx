import RepositoryDetailPageClient from "@/components/code-viewer/RepositoryDetailPageClient";

export function generateStaticParams() {
  return [
    { id: "sample-project" },
    { id: "my-project" },
    { id: "ecommerce-platform" },
    { id: "auth-service" },
    { id: "fastapi-backend" },
    { id: "shared-core-lib" },
    { id: "payment-service" },
  ];
}

export default function RepositoryDetailPage() {
  return <RepositoryDetailPageClient />;
}
