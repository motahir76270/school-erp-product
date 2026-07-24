// app/components/modals/reset-password-modal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { resetTeacherPasswordApiCall } from '@/store/slices/teacherSlice';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: any | null;
  onSuccess: () => void;
}

export function ResetPasswordModal({ isOpen, onClose, teacherId, onSuccess }: ResetPasswordModalProps) {
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId) return;

    setIsResetting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found');
        setIsResetting(false);
        return;
      }

      const data = await resetTeacherPasswordApiCall(
        token,
        teacherId,
        resetPassword || undefined
      );

      if (data?.success === true) {
        toast.success(data?.message || 'Password reset successfully');
        if (data?.data?.newPassword) {
          toast.info(`New password: ${data.data.newPassword}`);
        }
        onSuccess();
        onClose();
        setResetPassword('');
      } else {
        toast.error(data?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reset Teacher Password</DialogTitle>
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
              onClick={() => {
                setResetPassword('');
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}