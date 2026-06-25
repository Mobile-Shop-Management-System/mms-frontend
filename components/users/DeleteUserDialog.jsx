"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, XCircle } from "lucide-react";

export function DeleteUserDialog({ user, onClose, isDeleting, error, onConfirm, onErrorClose }) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onErrorClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onErrorClose]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="p-6 space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Cannot Delete User</AlertTitle>
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
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Delete User</AlertTitle>
            <AlertDescription>
              Are you sure you want to permanently delete the user{" "}
              <span className="font-semibold">{user.username}</span>? This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>User Details:</strong>
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                <strong>Name:</strong> {user.first_name} {user.last_name}
              </li>
              <li>
                <strong>Email:</strong> {user.email}
              </li>
              <li>
                <strong>Role:</strong> {user.role}
              </li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
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
