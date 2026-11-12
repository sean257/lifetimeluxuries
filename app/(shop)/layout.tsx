import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BagProvider } from "@/components/bag-provider";
import { BagDrawer } from "@/components/bag-drawer";
import { SkipLink } from "@/components/skip-link";

export default function ShopLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <BagProvider>
      <SkipLink />
      <SiteHeader />
      {children}
      <SiteFooter />
      {modal}
      <BagDrawer />
    </BagProvider>
  );
}
