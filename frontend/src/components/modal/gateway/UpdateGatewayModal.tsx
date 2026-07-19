// app/dashboard/payment-gateways/components/UpdateGatewayModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '@/store/hooks';
import { 
  updateGatewayApiCall, 
  updateGatewayInList,
  setLoading 
} from '@/store/slices/gatewaySlice';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// ==================== Types ====================
interface PaymentGateway {
  id: string;
  userId: string;
  key: string;
  secretKey: string;
  name: string;
  callBackUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Zod Schema ====================
const updateGatewaySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .nonempty('Name is required'),
  key: z
    .string()
    .min(5, 'Key must be at least 5 characters')
    .max(50, 'Key must be less than 50 characters')
    .nonempty('Key is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Key can only contain letters, numbers, underscores, and hyphens'),
  secretKey: z
    .string()
    .min(8, 'Secret key must be at least 8 characters')
    .max(100, 'Secret key must be less than 100 characters')
    .nonempty('Secret key is required'),
  callBackUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
});

type UpdateGatewayFormData = z.infer<typeof updateGatewaySchema>;

// ==================== Component ====================
interface UpdateGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: PaymentGateway | null;
  onSuccess?: () => void;
}

export default function UpdateGatewayModal({
  open,
  onOpenChange,
  gateway,
  onSuccess,
}: UpdateGatewayModalProps) {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateGatewayFormData>({
    resolver: zodResolver(updateGatewaySchema),
    defaultValues: {
      name: '',
      key: '',
      secretKey: '',
      callBackUrl: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  // Populate form when gateway changes
  useEffect(() => {
    if (gateway) {
      reset({
        name: gateway.name || '',
        key: gateway.key || '',
        secretKey: gateway.secretKey || '',
        callBackUrl: gateway.callBackUrl || '',
        isActive: gateway.isActive ?? true,
      });
    }
  }, [gateway, reset]);

  const onSubmit = async (data: UpdateGatewayFormData) => {
    if (!gateway) {
      toast.error('No gateway selected');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await updateGatewayApiCall(token, {
        id: gateway.id,
        name: data.name,
        key: data.key,
        secretKey: data.secretKey,
        callBackUrl: data.callBackUrl || undefined,
        isActive: data.isActive,
      });

      if (response?.success) {
        toast.success(response?.message || 'Payment gateway updated successfully');
        dispatch(updateGatewayInList(response.data));
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response?.message || 'Failed to update payment gateway');
      }
    } catch (error: any) {
      console.error('Update gateway error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update payment gateway');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const toggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Payment Gateway</DialogTitle>
          <DialogDescription>
            Edit the payment gateway configuration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Gateway Name */}
          <div className="space-y-2">
            <Label htmlFor="update-name">
              Gateway Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="update-name"
              {...register('name')}
              placeholder="e.g., PayPal, Stripe, Razorpay"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="update-key">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="update-key"
              {...register('key')}
              placeholder="Enter API key"
              className={errors.key ? 'border-red-500' : ''}
            />
            {errors.key && (
              <p className="text-sm text-red-500">{errors.key.message}</p>
            )}
          </div>

          {/* Secret Key with visibility toggle */}
          <div className="space-y-2">
            <Label htmlFor="update-secretKey">
              Secret Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="update-secretKey"
                type={showSecretKey ? 'text' : 'password'}
                {...register('secretKey')}
                placeholder="Enter secret key"
                className={errors.secretKey ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={toggleSecretKeyVisibility}
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.secretKey && (
              <p className="text-sm text-red-500">{errors.secretKey.message}</p>
            )}
          </div>

          {/* Callback URL */}
          <div className="space-y-2">
            <Label htmlFor="update-callBackUrl">Callback URL</Label>
            <Input
              id="update-callBackUrl"
              {...register('callBackUrl')}
              placeholder="https://example.com/webhook/payment"
              className={errors.callBackUrl ? 'border-red-500' : ''}
            />
            {errors.callBackUrl && (
              <p className="text-sm text-red-500">{errors.callBackUrl.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="update-isActive" className="text-sm font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this payment gateway
              </p>
            </div>
            <Switch
              id="update-isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {/* Gateway Info */}
          {gateway && (
            <div className="bg-muted p-3 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway ID:</span>
                <span className="font-mono">{gateway.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(gateway.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(gateway.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Gateway'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}