import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/Toaster";
import { isApiError } from "@/lib/api-response";
import { accountApi } from "@/api/account";
import { useAuthStore } from "@/stores/auth";
import { paths } from "@/routes/paths";

export default function SecurityPage() {
  const { success: showSuccess, error: showError } = useToast();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await accountApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      showSuccess("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      if (isApiError(e) && e.errors) {
        showError(Object.values(e.errors).flat()[0] || e.message);
      } else {
        showError(isApiError(e) ? e.message : "Failed to change password");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim() !== "DELETE") {
      showError('Type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      showError("Enter your password to confirm");
      return;
    }
    setDeleting(true);
    try {
      await accountApi.deactivateAccount(deletePassword);
      logout();
      navigate(paths.home, { replace: true });
      showSuccess("Your account has been deactivated. We're sorry to see you go.");
    } catch (e) {
      if (isApiError(e) && e.errors) {
        showError(Object.values(e.errors).flat()[0] || e.message);
      } else {
        showError(isApiError(e) ? e.message : "Failed to deactivate account");
      }
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your password and account safety.
        </p>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Change password</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current password <span className="text-red-500">*</span></Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-10" autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">New password <span className="text-red-500">*</span></Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10" autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password <span className="text-red-500">*</span></Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10" autoComplete="new-password" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleChangePassword} disabled={savingPassword} className="inline-flex items-center gap-2">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/40 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Danger zone</h2>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Delete account</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Permanently deactivate your account and sign out of all devices.
            </p>
          </div>
          <Button variant="outline" onClick={() => setDeleteOpen(true)} className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30">
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete account
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account?" maxWidth="md">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-red-700 dark:text-red-400">
            <p className="font-semibold">This action is permanent.</p>
            <p className="mt-1">
              Your account will be deactivated, you'll be signed out of all devices, and you will
              lose access to your order history and saved addresses. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-semibold text-red-600">DELETE</span> to confirm
            </Label>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="h-10" placeholder="DELETE" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your password <span className="text-red-500">*</span></Label>
            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="h-10" autoComplete="current-password" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700">
            {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Delete account
          </Button>
        </div>
      </Modal>
    </div>
  );
}
