export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="items-center justify-center">
      {children}
    </div>
  );
}