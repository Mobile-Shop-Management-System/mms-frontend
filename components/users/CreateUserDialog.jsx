"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateUserMutation } from "@/hooks/useUsers";
import { useShops } from "@/hooks/useShops";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["shop_admin", "salesman"]),
});

const ROLES = [
  { value: "shop_admin", label: "Shop Admin" },
  { value: "salesman", label: "Salesman" },
];

export function CreateUserDialog({ onClose }) {
  const { user: currentUser } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: createUser, isPending } = useCreateUserMutation();
  const isSuperAdmin =
    currentUser?.effective_role === "super_admin" || currentUser?.is_superuser;
  const { data: shops = [], isLoading: shopsLoading } = useShops({
    enabled: isSuperAdmin,
  });

  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      password: "",
      role: "salesman",
      shop_id: "",
    },
  });

  function onSubmit(data) {
    setError("");
    if (isSuperAdmin && !data.shop_id) {
      const message = "Please select the shop for this user.";
      form.setError("shop_id", { message });
      toast.error(message);
      return;
    }
    createUser(data, {
      onSuccess: () => {
        form.reset();
        toast.success("User created successfully.");
        onClose();
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || "Failed to create user";
        setError(msg);
        toast.error(msg);
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="sticky top-0 bg-background border-b border-border/40 flex items-center justify-between p-6">
          <h2 className="text-lg font-semibold">Create New User</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="john_doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Letters, numbers, underscores only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+92 300 0000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((p) => !p)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Minimum 8 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="shop_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Shop *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={shopsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                shopsLoading
                                  ? "Loading shops..."
                                  : "Select a shop"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shops.map((shop) => (
                            <SelectItem key={shop.id} value={String(shop.id)}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The user will appear under this shop's staff tree.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  )}
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
