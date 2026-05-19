import AuthGuard from "../../components/AuthGuard";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requiredRole="doctor">{children}</AuthGuard>;
}
