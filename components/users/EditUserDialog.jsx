"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ROLE_OPTIONS = [
  { value: "shop_admin", label: "Shop Admin" },
  { value: "salesman", label: "Salesman" },
];

export function EditUserDialog({
  user,
  onClose,
  isProcessing,
  error,
  onConfirm,
  onErrorClose,
}) {
  const { user: currentUser } = useAuth();
  const isOwnSuperAdmin =
    currentUser?.id === user.id &&
    (currentUser?.effective_role === "super_admin" ||
      currentUser?.is_superuser);
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.effective_role || user.role || "salesman",
    is_active: user.is_active ?? true,
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onErrorClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onErrorClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, is_active: value === "active" }));
  };

  const handleSubmit = () => {
    onConfirm(formData);
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="p-6 space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error Updating User</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onErrorClose}
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Edit User</h2>
            <p className="text-sm text-muted-foreground">
              Update user information
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="first_name" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="First name"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="last_name" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Last name"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                disabled={isProcessing || isOwnSuperAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOwnSuperAdmin && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Super Admin role cannot be changed from this account.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={handleStatusChange}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Updating..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
