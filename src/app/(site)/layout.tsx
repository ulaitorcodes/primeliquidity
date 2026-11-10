import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}