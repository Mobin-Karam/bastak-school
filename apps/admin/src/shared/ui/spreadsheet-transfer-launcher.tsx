import { FileSpreadsheet } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { ResponsiveDrawer } from "./responsive-drawer";
import { useModal } from "./modal";
import { Button } from "./ui";

const mobileQuery = "(max-width: 767px)";

function useMobileTransferSurface() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(mobileQuery).matches : false,
  );
  useEffect(() => {
    const media = window.matchMedia(mobileQuery);
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * One responsive entry point for all spreadsheet transfer workflows.
 * Desktop uses the Admin modal; phones use the focus-managed bottom sheet.
 */
export function SpreadsheetTransferLauncher({
  title,
  description,
  trigger,
  children,
}: {
  title: string;
  description: string;
  trigger: string;
  children: ReactNode;
}) {
  const modal = useModal();
  const mobile = useMobileTransferSurface();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = () => {
    if (mobile) setDrawerOpen(true);
    else modal.open({ title, description, size: "xl", content: children });
  };
  return (
    <>
      <Button size="sm" variant="soft" onClick={open}>
        <FileSpreadsheet size={16} aria-hidden="true" />
        {trigger}
      </Button>
      <ResponsiveDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={title}
        description={description}
        className="md:hidden"
      >
        {children}
      </ResponsiveDrawer>
    </>
  );
}
