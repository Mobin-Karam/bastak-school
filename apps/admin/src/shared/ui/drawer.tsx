import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/shared/lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerNested = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;
const DrawerVirtualKeyboardProvider = DrawerPrimitive.VirtualKeyboardProvider;
const DrawerHandle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mx-auto mt-3 h-1.5 w-14 shrink-0 rounded-full bg-slate-400 md:hidden",
      className,
    )}
    {...props}
  />
);

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-[120] bg-black/55 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Popup>
>(({ className, children, ...props }, ref) => (
  <DrawerPrimitive.Portal>
    <DrawerPrimitive.Backdrop className="fixed inset-0 z-[120] bg-black/55 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
    <DrawerPrimitive.Viewport className="fixed inset-0 z-[121] overflow-hidden outline-none">
      <DrawerPrimitive.Popup
        ref={ref}
        className={cn(
          "responsive-drawer-popup z-[121] flex flex-col overflow-hidden border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-[rgb(var(--color-ink))] shadow-2xl outline-none",
          className,
        )}
        {...props}
      >
        <DrawerHandle />
        <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </DrawerPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "relative grid shrink-0 gap-1.5 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 pe-16 text-start sm:p-5 sm:pe-16",
      className,
    )}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-[rgb(var(--color-ink))]",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[rgb(var(--muted-foreground))]", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerHandle,
  DrawerNested,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerVirtualKeyboardProvider,
};
