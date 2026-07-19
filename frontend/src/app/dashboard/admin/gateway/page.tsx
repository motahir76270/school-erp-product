// app/dashboard/payment-gateways/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAllGatewaysApiCall,
  updateGatewayStatusApiCall,
  deleteGatewayApiCall,
  setGateways,
  setLoading,
  setError,
  updateGatewayStatus,
  removeGatewayFromList,
} from '@/store/slices/gatewaySlice';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, RefreshCw, MoreVertical, Edit, Trash2, Power, PowerOff, Eye, User } from 'lucide-react';
import { toast } from 'react-toastify';
import UpdateGatewayModal from '@/src/components/modal/gateway/UpdateGatewayModal';
import CreateGatewayModal from '@/src/components/modal/gateway/CreateGatewayModal';


interface User {
  id: string;
  userId: string | null;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

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
  user?: User;
}

export default function PaymentGatewaysPage() {
  const dispatch = useAppDispatch();
  const { gateways, loading, pagination } = useAppSelector((state: any) => state.gateway);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch Gateways
  const fetchGateways = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    dispatch(setLoading(true));
    try {
      const data = await getAllGatewaysApiCall(token, {
        page,
        search: search || undefined,
        limit: 10,
      });

      if (data?.success) {
        dispatch(setGateways(data.data));
      } else {
        toast.error(data?.message || 'Failed to fetch gateways');
        dispatch(setError(data?.message || 'Failed to fetch gateways'));
      }
    } catch (error: any) {
      console.error('Fetch gateways error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch gateways');
      dispatch(setError(error?.response?.data?.message || 'Failed to fetch gateways'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchGateways();
  }, [page, search]);

  // Handle Toggle Status
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await updateGatewayStatusApiCall(token, {
        id,
        isActive: !isActive,
      });

      if (data?.success) {
        toast.success(data?.message || 'Gateway status updated');
        dispatch(updateGatewayStatus({ id, isActive: !isActive }));
        await fetchGateways();
      } else {
        toast.error(data?.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  // Handle Delete Gateway
  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment gateway?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    try {
      const data = await deleteGatewayApiCall(token, { id });
      if (data?.success) {
        toast.success(data?.message || 'Gateway deleted successfully');
        dispatch(removeGatewayFromList(id));
        await fetchGateways();
      } else {
        toast.error(data?.message || 'Failed to delete gateway');
      }
    } catch (error: any) {
      console.error('Delete gateway error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete gateway');
    }
  };

  // Handle Edit Gateway - Open Update Modal
  const handleEditGateway = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setIsUpdateModalOpen(true);
  };

  // Handle View Gateway
  const handleViewGateway = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500 hover:bg-green-600'
      : 'bg-red-500 hover:bg-red-600';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const baseURl = process.env.NEXT_PUBLIC_BASE_URL_FILE;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payment Gateways" 
        description="Manage payment gateway integrations"
       />
       
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchGateways} 
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Gateway
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Gateways</CardTitle>
          <CardDescription>Manage your payment gateway integrations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search gateways by name, key, or user..."
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gateway</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading gateways...
                    </TableCell>
                  </TableRow>
                ) : gateways.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <p>No payment gateways found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsCreateModalOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first gateway
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  gateways.map((gateway: PaymentGateway) => (
                    <TableRow key={gateway.id}>
                      {/* Gateway Info */}
                      <TableCell>
                        <div>
                          <p className="font-medium">{gateway.name}</p>
                          {gateway.callBackUrl && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {gateway.callBackUrl}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* User Info with Avatar */}
                      <TableCell>
                        {gateway.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={gateway.user.profileImage ? `${baseURl}/${gateway.user.profileImage}` : undefined} 
                                alt={`${gateway.user.firstName} ${gateway.user.lastName}`}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(gateway.user.firstName, gateway.user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {gateway.user.firstName} {gateway.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {gateway.user.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">Unknown User</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Key */}
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {gateway.key.substring(0, 8)}...
                        </code>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge className={getStatusBadge(gateway.isActive)}>
                          {gateway.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="text-sm">
                        {new Date(gateway.createdAt).toLocaleDateString()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewGateway(gateway)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditGateway(gateway)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(gateway.id, gateway.isActive)}
                            >
                              {gateway.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGateway(gateway.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && gateways.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} • 
                Total: {pagination.totalItems} items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Gateway Modal */}
      <CreateGatewayModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchGateways}
      />

      {/* Update Gateway Modal */}
      <UpdateGatewayModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        gateway={selectedGateway}
        onSuccess={fetchGateways}
      />

      {/* View Gateway Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gateway Details</DialogTitle>
            <DialogDescription>
              Complete information about the payment gateway
            </DialogDescription>
          </DialogHeader>
          {selectedGateway && (
            <div className="space-y-6">
              {/* Gateway Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedGateway.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusBadge(selectedGateway.isActive)}>
                    {selectedGateway.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Key</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                    {selectedGateway.key}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secret Key</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {'•'.repeat(Math.min(selectedGateway.secretKey.length, 20))}
                  </code>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Callback URL</p>
                  <p className="font-medium break-all">
                    {selectedGateway.callBackUrl || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {new Date(selectedGateway.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated At</p>
                  <p className="font-medium">
                    {new Date(selectedGateway.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* User Info */}
              {selectedGateway.user && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Associated User</h4>
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={selectedGateway.user.profileImage ? `${baseURl}/${selectedGateway.user.profileImage}` : undefined} 
                        alt={`${selectedGateway.user.firstName} ${selectedGateway.user.lastName}`}
                      />
                      <AvatarFallback className="text-sm">
                        {getInitials(selectedGateway.user.firstName, selectedGateway.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedGateway.user.firstName} {selectedGateway.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedGateway.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {selectedGateway.user.role}
                        </Badge>
                        <Badge className={selectedGateway.user.isActive ? 'bg-green-500' : 'bg-red-500'}>
                          {selectedGateway.user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditGateway(selectedGateway);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Gateway
                </Button>
                <Button
                  variant={selectedGateway.isActive ? 'destructive' : 'default'}
                  className="flex-1"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleToggleStatus(selectedGateway.id, selectedGateway.isActive);
                  }}
                >
                  {selectedGateway.isActive ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}