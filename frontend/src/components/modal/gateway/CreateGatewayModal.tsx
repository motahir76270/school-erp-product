// app/dashboard/payment-gateways/components/CreateGatewayModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '@/store/hooks';
import { createGatewayApiCall, addGateway, setLoading } from '@/store/slices/gatewaySlice';
import { getAllUsersApiCall, setUsers } from '@/store/slices/userSlice';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-toastify';
import { Loader2, User, RefreshCw } from 'lucide-react';

// ==================== Types ====================
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  role: string;
  isActive: boolean;
}

// ==================== Zod Schema ====================
const createGatewaySchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
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

type CreateGatewayFormData = z.infer<typeof createGatewaySchema>;

// ==================== Component ====================
interface CreateGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateGatewayModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateGatewayModalProps) {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGatewayFormData>({
    resolver: zodResolver(createGatewaySchema),
    defaultValues: {
      userId: '',
      name: '',
      key: '',
      secretKey: '',
      callBackUrl: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');
  const selectedUserId = watch('userId');

  // Fetch Users
  const fetchUsers = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    setIsLoadingUsers(true);
    try {
      const data = await getAllUsersApiCall(token, 1, searchUser);
      if (data?.success === true) {
        let usersData = [];
        if (data?.data?.data && Array.isArray(data.data.data)) {
          usersData = data.data.data;
        } else if (data?.data && Array.isArray(data.data)) {
          usersData = data.data;
        } else {
          usersData = [];
        }
        setUsersList(usersData);
      } else {
        toast.error(data?.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Fetch users error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, searchUser]);

  const onSubmit = async (data: CreateGatewayFormData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    if (!data.userId) {
      toast.error('Please select a user');
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await createGatewayApiCall(token, {
        userId: data.userId,
        name: data.name,
        key: data.key,
        secretKey: data.secretKey,
        callBackUrl: data.callBackUrl || undefined,
        isActive: data.isActive,
      });

      if (response?.success) {
        toast.success(response?.message || 'Payment gateway created successfully');
        dispatch(addGateway(response.data));
        reset();
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response?.message || 'Failed to create payment gateway');
      }
    } catch (error: any) {
      console.error('Create gateway error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create payment gateway');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment Gateway</DialogTitle>
          <DialogDescription>
            Configure a new payment gateway integration for a user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="userId">
              User <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onValueChange={(value) => setValue('userId', value)}
              >
                <SelectTrigger 
                  className={errors.userId ? 'border-red-500' : ''}
                  disabled={isLoadingUsers}
                >
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profileImage ? `${process.env.NEXT_PUBLIC_BASE_URL_FILE}/${user.profileImage}` : undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-muted-foreground">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchUsers}
                disabled={isLoadingUsers}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {errors.userId && (
              <p className="text-sm text-red-500">{errors.userId.message}</p>
            )}
            
            {/* Selected User Info */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.profileImage ? `${process.env.NEXT_PUBLIC_BASE_URL_FILE}/${selectedUser.profileImage}` : undefined} />
                  <AvatarFallback>
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email} • {selectedUser.role}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Gateway Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., PayPal, Stripe, Razorpay"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Key */}
          <div className="space-y-2">
            <Label htmlFor="key">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="key"
              {...register('key')}
              placeholder="Enter API key"
              className={errors.key ? 'border-red-500' : ''}
            />
            {errors.key && (
              <p className="text-sm text-red-500">{errors.key.message}</p>
            )}
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secretKey">
              Secret Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="secretKey"
              type="password"
              {...register('secretKey')}
              placeholder="Enter secret key"
              className={errors.secretKey ? 'border-red-500' : ''}
            />
            {errors.secretKey && (
              <p className="text-sm text-red-500">{errors.secretKey.message}</p>
            )}
          </div>

          {/* Callback URL */}
          <div className="space-y-2">
            <Label htmlFor="callBackUrl">Callback URL</Label>
            <Input
              id="callBackUrl"
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
              <Label htmlFor="isActive" className="text-sm font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this payment gateway
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

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
                  Creating...
                </>
              ) : (
                'Create Gateway'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}