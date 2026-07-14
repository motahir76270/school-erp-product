'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, UserRound } from 'lucide-react';
import axios from 'axios';

interface UserRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
}

export default function Page() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    profileImage: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setUsers(response.data.data || []);
    } catch {
      setMessage('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [search]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const query = search.toLowerCase();
    return !query || [user.firstName, user.lastName, user.email, user.role].join(' ').toLowerCase().includes(query);
  }), [search, users]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      let profileImage = form.profileImage;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        profileImage = uploadResponse.data.data?.url || '';
      }

      await axios.post('/api/users', {
        ...form,
        profileImage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', phone: '', profileImage: '' });
      setAvatarFile(null);
      setMessage('User created successfully.');
      await fetchUsers();
    } catch {
      setMessage('Unable to create user.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('User deleted.');
      await fetchUsers();
    } catch {
      setMessage('Unable to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage admin, student, teacher, and other platform users." />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create a user</CardTitle>
            <CardDescription>Use this form to add a new platform user with an avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="student" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile image</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full">Create user</Button>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing users</CardTitle>
              <CardDescription>Search and manage accounts.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchUsers()}>
              <Search className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="pl-9" />
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {user.profileImage ? <img src={user.profileImage} alt="avatar" className="h-10 w-10 rounded-full object-cover" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => void handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
