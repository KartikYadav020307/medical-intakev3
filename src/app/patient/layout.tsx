import AuthGuard from "../../components/AuthGuard";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
