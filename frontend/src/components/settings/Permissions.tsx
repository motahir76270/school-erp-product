// dashboard/admin/settings/components/Permissions.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { 
  Shield, 
  Users, 
  UserCog, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[];
  roles: string[];
  status: 'active' | 'inactive';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  users: number;
}

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: '1',
      name: 'Manage Users',
      description: 'Create, edit, and delete users',
      module: 'User Management',
      actions: ['create', 'read', 'update', 'delete'],
      roles: ['super_admin', 'admin'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Manage Subjects',
      description: 'Create, edit, and delete subjects',
      module: 'Academic',
      actions: ['create', 'read', 'update', 'delete'],
      roles: ['super_admin', 'admin'],
      status: 'active',
    },
    {
      id: '3',
      name: 'View Reports',
      description: 'View all reports and analytics',
      module: 'Reports',
      actions: ['read'],
      roles: ['super_admin', 'admin', 'teacher'],
      status: 'active',
    },
  ]);

  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['1', '2', '3'],
      users: 1,
    },
    {
      id: '2',
      name: 'Admin',
      description: 'Administrative access',
      permissions: ['1', '2', '3'],
      users: 3,
    },
    {
      id: '3',
      name: 'Teacher',
      description: 'Teacher access',
      permissions: ['3'],
      users: 15,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleStatus = (id: string) => {
    setPermissions(permissions.map(p => 
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
    toast.success('Permission status updated');
  };

  const handleDeletePermission = (id: string) => {
    if (confirm('Are you sure you want to delete this permission?')) {
      setPermissions(permissions.filter(p => p.id !== id));
      toast.success('Permission deleted successfully');
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-500">Active</Badge>
      : <Badge variant="destructive">Inactive</Badge>;
  };

  const getActionsBadges = (actions: string[]) => {
    return actions.map((action) => (
      <Badge key={action} variant="outline" className="mr-1">
        {action}
      </Badge>
    ));
  };

  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Permissions</h2>
          <p className="text-muted-foreground">
            Manage user permissions and access control
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Search Permissions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, module, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Module</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="user-management">User Management</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Overview</CardTitle>
          <CardDescription>Current roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{role.name}</h4>
                  </div>
                  <Badge variant="secondary">{role.users} users</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Permissions: {role.permissions.length}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions List</CardTitle>
          <CardDescription>All available permissions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No permissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.module}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {permission.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getActionsBadges(permission.actions)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {permission.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(permission.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {}}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(permission.id)}>
                              {permission.status === 'active' ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePermission(permission.id)}
                              className="text-red-500"
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
        </CardContent>
      </Card>

      {/* Create Permission Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Add a new permission to the system
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Permission Name *</Label>
              <Input placeholder="e.g., Manage Users" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input placeholder="e.g., Create, edit, and delete users" />
            </div>
            <div className="space-y-2">
              <Label>Module *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-management">User Management</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex flex-wrap gap-2">
                {['create', 'read', 'update', 'delete'].map((action) => (
                  <div key={action} className="flex items-center gap-2">
                    <Switch />
                    <span className="text-sm capitalize">{action}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {['super_admin', 'admin', 'teacher', 'student'].map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <Switch />
                    <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Permission
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}