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

interface TeacherRecord {
  id: number;
  employeeId: string;
  specialization?: string;
  isActive: boolean;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

export default function Page() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
    qualification: '',
    experience: '0',
    specialization: '',
    salary: '0',
    joiningDate: '',
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/teachers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setTeachers(response.data.data || []);
    } catch {
      setMessage('Unable to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeachers();
  }, [search]);

  const filteredTeachers = useMemo(() => teachers.filter((teacher) => {
    const query = search.toLowerCase();
    return !query || [teacher.user?.firstName, teacher.user?.lastName, teacher.user?.email, teacher.employeeId, teacher.specialization].join(' ').toLowerCase().includes(query);
  }), [search, teachers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      let profileImage = '';

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        profileImage = uploadResponse.data.data?.url || '';
      }

      await axios.post('/api/teachers', {
        user: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          profileImage,
        },
        employeeId: form.employeeId,
        qualification: form.qualification,
        experience: Number(form.experience),
        specialization: form.specialization,
        salary: form.salary,
        joiningDate: form.joiningDate,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        employeeId: '',
        qualification: '',
        experience: '0',
        specialization: '',
        salary: '0',
        joiningDate: '',
      });
      setAvatarFile(null);
      setMessage('Teacher created successfully.');
      await fetchTeachers();
    } catch {
      setMessage('Unable to create teacher.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/teachers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Teacher deleted.');
      await fetchTeachers();
    } catch {
      setMessage('Unable to delete teacher.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" description="Create and manage teacher records with profile images." />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add teacher</CardTitle>
            <CardDescription>Submit a new teacher profile and upload a photo.</CardDescription>
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
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input id="qualification" value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input id="experience" type="number" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input id="salary" value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining date</Label>
                  <Input id="joiningDate" type="date" value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile image</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full">Create teacher</Button>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Teacher roster</CardTitle>
              <CardDescription>Search and remove existing teacher entries.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchTeachers()}>
              <Search className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teachers" className="pl-9" />
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            <div className="space-y-3">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {teacher.user?.profileImage ? <img src={teacher.user.profileImage} alt="avatar" className="h-10 w-10 rounded-full object-cover" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{teacher.user?.firstName} {teacher.user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{teacher.employeeId} • {teacher.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={teacher.isActive ? 'success' : 'secondary'}>{teacher.isActive ? 'Active' : 'Inactive'}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => void handleDelete(teacher.id)}>
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
