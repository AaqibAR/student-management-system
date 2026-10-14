import ProtectedWorkspace from "@/components/ProtectedWorkspace";
import StudentDirectory from "@/components/StudentDirectory";

export default function StudentsPage() {
  return <ProtectedWorkspace><StudentDirectory /></ProtectedWorkspace>;
}
