"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

type SheetSide = "top" | "right" | "bottom" | "left"

type SheetContextValue = {
  open: boolean
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

const overlayVariants: Variants = {
  closed: { opacity: 0, backdropFilter: "blur(0px)" },
  open: { opacity: 1, backdropFilter: "blur(2px)" },
}

const overlayTransition: Transition = {
  duration: 0.18,
  ease: "easeOut",
}

const reducedOverlayTransition: Transition = {
  duration: 0.05,
  ease: "linear",
}

const sheetTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.9,
}

const sheetExitTransition: Transition = {
  type: "tween",
  duration: 0.2,
  ease: [0.32, 0, 0.67, 0],
}

const reducedSheetTransition: Transition = {
  duration: 0.05,
  ease: "linear",
}

function getSheetClosedState(side: SheetSide) {
  switch (side) {
    case "top":
      return { y: "-100%", opacity: 0.98, scale: 0.985 }
    case "bottom":
      return { y: "100%", opacity: 0.98, scale: 0.985 }
    case "left":
      return { x: "-100%", opacity: 0.98 }
    case "right":
      return { x: "100%", opacity: 0.98 }
  }
}

function getSheetVariants(side: SheetSide, prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      closed: { opacity: 0, transition: reducedSheetTransition },
      open: { opacity: 1, transition: reducedSheetTransition },
    }
  }

  return {
    closed: { ...getSheetClosedState(side), transition: sheetExitTransition },
    open: { x: 0, y: 0, opacity: 1, scale: 1, transition: sheetTransition },
  }
}

function Sheet({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false
  )
  const open = controlledOpen ?? uncontrolledOpen

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  return (
    <SheetContext.Provider value={{ open }}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetContext.Provider>
  )
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const prefersReducedMotion = useReducedMotion() === true

  return (
    <SheetPrimitive.Overlay
      asChild
      forceMount
      data-slot="sheet-overlay"
      {...props}
    >
      <motion.div
        className={cn("fixed inset-0 z-50 bg-black/30 dark:bg-black/45", className)}
        variants={overlayVariants}
        initial="closed"
        animate="open"
        exit="closed"
        transition={prefersReducedMotion ? reducedOverlayTransition : overlayTransition}
      />
    </SheetPrimitive.Overlay>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide
  showCloseButton?: boolean
}) {
  const context = React.useContext(SheetContext)
  const open = context?.open ?? false
  const prefersReducedMotion = useReducedMotion() === true
  const sheetVariants = getSheetVariants(side, prefersReducedMotion)

  return (
    <AnimatePresence initial={false}>
      {open && (
        <SheetPortal forceMount>
          <SheetOverlay />
          <SheetPrimitive.Content
            asChild
            forceMount
            data-slot="sheet-content"
            data-side={side}
            {...props}
          >
            <motion.div
              className={cn(
                "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-2xl data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:rounded-t-[28px] data-[side=bottom]:border-t data-[side=bottom]:pb-[env(safe-area-inset-bottom,0px)] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
                className
              )}
              variants={sheetVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {children}
              {showCloseButton && (
                <SheetPrimitive.Close data-slot="sheet-close" asChild>
                  <Button
                    variant="ghost"
                    className="absolute top-3 right-3 size-11 rounded-full text-muted-foreground/75 hover:text-foreground"
                    size="icon"
                  >
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetPrimitive.Close>
              )}
            </motion.div>
          </SheetPrimitive.Content>
        </SheetPortal>
      )}
    </AnimatePresence>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 px-5 pb-2 pt-5", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
