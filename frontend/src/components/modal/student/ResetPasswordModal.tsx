// components/students/ResetPasswordModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetStudentPasswordApiCall } from '@/store/slices/studentSlice';
import { toast } from 'react-toastify';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  onSuccess?: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}: ResetPasswordModalProps) {
  const [resetPassword, setResetPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId) return;
    
    setIsResettingPassword(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsResettingPassword(false);
        return;
      }

      const data = await resetStudentPasswordApiCall(
        token, 
        studentId, 
        resetPassword || undefined
      );

      if (data?.success === true) {
        toast.success(data?.message || 'Password reset successfully');
        if (data?.data?.newPassword) {
          toast.info(`New password: ${data.data.newPassword}`);
        }
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        toast.error(data?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleClose = () => {
    setResetPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reset Student Password</DialogTitle>
          <DialogDescription>
            Enter a new password or leave empty to use the default password (123456).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Leave empty for default (123456)"
              minLength={6}
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isResettingPassword}>
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}