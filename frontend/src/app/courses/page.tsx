import ProtectedWorkspace from "@/components/ProtectedWorkspace";
import CourseCatalog from "@/components/CourseCatalog";

export default function CoursesPage() {
  return <ProtectedWorkspace><CourseCatalog /></ProtectedWorkspace>;
}
