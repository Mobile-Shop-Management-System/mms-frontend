"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authApi from "@/lib/api/auth";
import { AlertCircle, Check, Camera, Trash2, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [crop, setCrop] = useState({ unit: "%", width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [avatarCacheBust, setAvatarCacheBust] = useState(Date.now());
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
  }, [user, resetProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setIsCropping(true);
      setAvatarError("");
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleUploadCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImage();
      if (!croppedBlob) return;

      setIsUploadingAvatar(true);
      setAvatarError("");
      setAvatarMessage("");

      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");

      await authApi.uploadAvatar(formData);
      setAvatarCacheBust(Date.now());
      await refreshUser();

      setAvatarMessage("Profile picture updated successfully");
      setAvatarPreview(null);
      setIsCropping(false);
      setCompletedCrop(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setAvatarMessage(""), 3000);
    } catch (err) {
      setAvatarError(err.response?.data?.error || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setAvatarError("");
      setAvatarMessage("");

      await authApi.removeAvatar();
      setAvatarCacheBust(Date.now());
      await refreshUser();
      setAvatarMessage("Profile picture removed successfully");
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setAvatarMessage(""), 3000);
    } catch (err) {
      setAvatarError(err.response?.data?.error || "Failed to remove avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setUpdateMessage("");
      setUpdateError("");
      await authApi.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name || "",
        phone: data.phone || "",
      });
      setUpdateMessage("Profile updated successfully");
      setIsEditing(false);
      await refreshUser();

      setTimeout(() => setUpdateMessage(""), 3000);
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setPasswordMessage("");
      setPasswordError("");
      const passwordData = {
        old_password: data.old_password,
        new_password: data.new_password,
      };

      await authApi.changePassword(passwordData);
      setPasswordMessage("Password changed successfully");
      resetPassword();
      setIsChangingPassword(false);

      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Failed to change password");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full space-y-8">
      {/* Header with Avatar */}
      <div className="relative rounded-2xl bg-linear-to-r from-blue-600 via-blue-500 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative px-8 py-12">
          <div className="flex items-end gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={`${user.avatar_url}?t=${avatarCacheBust}`}
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-600">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="text-white pb-2 flex-1">
              <h1 className="text-4xl font-bold">{user?.first_name} {user?.last_name}</h1>
              <p className="text-blue-100 mt-2">@{user?.username}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-sm font-semibold text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {avatarMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <Check className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{avatarMessage}</span>
        </div>
      )}
      {avatarError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{avatarError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          {/* Account Card */}
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Account Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</p>
                <p className="text-sm font-medium mt-2">@{user?.username}</p>
              </div>
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-medium mt-2">{new Date(user?.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="border-t border-border/40 pt-4">
                <span className="inline-flex items-center px-4 py-2 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold capitalize border border-blue-500/30 dark:border-blue-500/50">{user?.role}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Edit
                </Button>
              )}
            </div>

            <div className="p-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">First Name</p>
                      <p className="text-base font-medium">{user?.first_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Last Name</p>
                      <p className="text-base font-medium">{user?.last_name || "—"}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email (Read-only)</p>
                        <p className="text-sm font-medium mt-1 break-all">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium mt-1">{user?.phone || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                  {updateMessage && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{updateMessage}</span>
                    </div>
                  )}
                  {updateError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{updateError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name *</label>
                      <Input placeholder="First name" {...registerProfile("first_name")} />
                      {profileErrors.first_name && (
                        <p className="text-xs text-red-500">{profileErrors.first_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input placeholder="Last name" {...registerProfile("last_name")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input placeholder="Phone number" {...registerProfile("phone")} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email (Read-only)</label>
                    <Input disabled value={user.email} className="bg-muted text-muted-foreground" />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isSubmittingProfile}>
                      {isSubmittingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsEditing(false);
                      resetProfile();
                      setUpdateMessage("");
                      setUpdateError("");
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                Security
              </h3>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  Change Password
                </Button>
              )}
            </div>

            <div className="p-6">
              {!isChangingPassword ? (
                <p className="text-sm text-muted-foreground">Click "Change Password" to update your password</p>
              ) : (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 max-w-md">
                  {passwordMessage && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{passwordMessage}</span>
                    </div>
                  )}
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{passwordError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password *</label>
                    <Input type="password" placeholder="Enter current password" {...registerPassword("old_password")} />
                    {passwordErrors.old_password && (
                      <p className="text-xs text-red-500">{passwordErrors.old_password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password *</label>
                    <Input type="password" placeholder="Enter new password" {...registerPassword("new_password")} />
                    {passwordErrors.new_password && (
                      <p className="text-xs text-red-500">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password *</label>
                    <Input type="password" placeholder="Confirm new password" {...registerPassword("confirm_password")} />
                    {passwordErrors.confirm_password && (
                      <p className="text-xs text-red-500">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isSubmittingPassword}>
                      {isSubmittingPassword ? "Updating..." : "Update Password"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsChangingPassword(false);
                      resetPassword();
                      setPasswordMessage("");
                      setPasswordError("");
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Profile Picture</DialogTitle>
          </DialogHeader>

          {avatarPreview && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg overflow-auto flex items-center justify-center" style={{ maxHeight: "500px" }}>
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={avatarPreview}
                    alt="Crop target"
                    style={{ maxHeight: "500px", width: "auto" }}
                  />
                </ReactCrop>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAvatarPreview(null);
                setIsCropping(false);
                setCompletedCrop(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isUploadingAvatar}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadCroppedImage} disabled={isUploadingAvatar}>
              {isUploadingAvatar ? "Uploading..." : "Upload Picture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
