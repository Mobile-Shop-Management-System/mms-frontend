import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
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
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/pos",
        label: "Point of Sale",
        icon: ShoppingCart,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/customers",
        label: "Customers",
        icon: Users,
        roles: ["shop_admin", "salesman"],
      },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      {
        href: "/dashboard/items",
        label: "Items",
        icon: Package,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/categories",
        label: "Categories",
        icon: Tags,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/brands",
        label: "Brands",
        icon: Tag,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/suppliers",
        label: "Suppliers",
        icon: Truck,
        roles: ["shop_admin"],
      },
    ],
  },
  {
    label: "TRANSACTIONS",
    items: [
      {
        href: "/dashboard/sales",
        label: "Sales History",
        icon: ClipboardList,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/khata",
        label: "Khata (Credit)",
        icon: BookOpen,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/used-phones",
        label: "Buy Used Phone",
        icon: Smartphone,
        roles: ["shop_admin"],
      },
      {
        href: "/dashboard/returns",
        label: "Returns",
        icon: RotateCcw,
        roles: ["shop_admin", "salesman"],
      },
    ],
  },
  {
    label: "ADMIN",
    items: [
      {
        href: "/dashboard/profile",
        label: "My Profile",
        icon: User,
        roles: ["shop_admin", "salesman"],
      },
      {
        href: "/dashboard/shops",
        label: "Shops",
        icon: ShoppingBag,
        roles: ["super_admin"],
      },
      {
        href: "/dashboard/users",
        label: "Users",
        icon: Users,
        roles: ["super_admin", "shop_admin"],
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        roles: ["shop_admin"],
      },
    ],
  },
];
