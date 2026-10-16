import ProtectedWorkspace from "@/components/ProtectedWorkspace";
import DashboardView from "@/components/DashboardView";

export default function DashboardPage() {
  return <ProtectedWorkspace><DashboardView /></ProtectedWorkspace>;
}
