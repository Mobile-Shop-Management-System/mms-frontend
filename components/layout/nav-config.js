import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Tag,
  Truck,
  Smartphone,
  ClipboardList,
  RotateCcw,
  Settings,
  BookOpen,
  Users,
  User,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { href: "/dashboard/items", label: "Items", icon: Package },
      { href: "/dashboard/categories", label: "Categories", icon: Tags },
      { href: "/dashboard/brands", label: "Brands", icon: Tag },
      { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "TRANSACTIONS",
    items: [
      { href: "/dashboard/sales", label: "Sales History", icon: ClipboardList },
      { href: "/dashboard/khata", label: "Khata (Credit)", icon: BookOpen },
      { href: "/dashboard/used-phones", label: "Buy Used Phone", icon: Smartphone },
      { href: "/dashboard/returns", label: "Returns", icon: RotateCcw },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/dashboard/profile", label: "My Profile", icon: User },
      { href: "/dashboard/users", label: "Users", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];
