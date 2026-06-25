import GuestRoute from "@/components/auth/GuestRoute";

export const metadata = {
  title: "ShopOS — Auth",
};

export default function AuthLayout({ children }) {
  return <GuestRoute>{children}</GuestRoute>;
}
