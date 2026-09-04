/**
 * Dos Tazas Design System — public barrel.
 *
 * A self-contained, brand-consistent component library that encodes the
 * Dos Tazas identity (warm coffee palette, Gotham/Titan One type, rounded soft
 * surfaces). Built on the same tokens as the rest of the app
 * (`src/app/globals.css`) so everything is dark-mode-aware automatically.
 *
 *   import { Button, Surface, StatCard, toast } from "@/design-system";
 */

// Foundations
export * from "./tokens";

// Basic
export { Button, buttonVariants, type ButtonProps } from "./components/Button";
export { IconButton, type IconButtonProps } from "./components/IconButton";
export { Badge, badgeVariants, type BadgeProps } from "./components/Badge";
export { StatusPill, statusPillVariants, type StatusPillProps, type StatusTone } from "./components/StatusPill";
export { Field, type FieldProps } from "./components/Field";
export { Input, type InputProps } from "./components/Input";
export { Textarea, type TextareaProps } from "./components/Textarea";
export { Select, type SelectProps } from "./components/Select";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export { RadioGroup, Radio, type RadioGroupProps, type RadioProps } from "./components/Radio";
export { Switch, type SwitchProps } from "./components/Switch";
export { Avatar, AvatarGroup, type AvatarProps } from "./components/Avatar";
export { Alert, type AlertProps } from "./components/Alert";
export { Tooltip, type TooltipProps } from "./components/Tooltip";
export { Spinner } from "./components/Spinner";
export { Skeleton, SkeletonCard } from "./components/Skeleton";
export { Progress, type ProgressProps } from "./components/Progress";
export { Divider, type DividerProps } from "./components/Divider";

// Advanced
export { Surface, SurfaceHeader, type SurfaceProps } from "./components/Surface";
export { StatCard, type StatCardProps } from "./components/StatCard";
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps } from "./components/Tabs";
export { Accordion, type AccordionProps, type AccordionItemData } from "./components/Accordion";
export { Modal, type ModalProps } from "./components/Modal";
export { toast } from "./components/toast";
export { DataTable, type Column, type DataTableProps } from "./components/DataTable";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { Pagination, type PaginationProps } from "./components/Pagination";
export { Breadcrumb, type Crumb } from "./components/Breadcrumb";
export { Stepper, type Step, type StepperProps } from "./components/Stepper";
export { SegmentedControl, type Segment, type SegmentedControlProps } from "./components/SegmentedControl";
export { QuantityStepper, type QuantityStepperProps } from "./components/QuantityStepper";
export {
  RoastLevelMeter,
  ROAST_LEVELS,
  type RoastLevel,
  type RoastLevelMeterProps,
} from "./components/RoastLevelMeter";
