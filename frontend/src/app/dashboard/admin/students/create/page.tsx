'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { ArrowLeft, Upload, X, UserPlus, Loader2 } from 'lucide-react';
import { AppDispatch, RootState } from '@/store';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { createStudent, clearError } from '@/src/store/slices/studentSlice';

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  rollNumber: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  admissionDate: string;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  fatherOccupation: string;
  motherOccupation: string;
  address: string;
}

export default function CreateStudentPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.student);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    rollNumber: '',
    admissionNumber: '',
    classId: '1',
    sectionId: '1',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: 'O+',
    emergencyContact: '',
    admissionDate: '',
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    fatherOccupation: '',
    motherOccupation: '',
    address: '',
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, WebP, GIF)');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setUploading(true);

      const studentData = {
        rollNumber: form.rollNumber,
        admissionNumber: form.admissionNumber,
        classId: Number(form.classId),
        sectionId: Number(form.sectionId),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        emergencyContact: form.emergencyContact || undefined,
        admissionDate: form.admissionDate,
        user: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password || 'password123',
          profileImage: avatarPreview || undefined,
        },
        parent: {
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherPhone: form.fatherPhone || undefined,
          motherPhone: form.motherPhone || undefined,
          fatherOccupation: form.fatherOccupation || undefined,
          motherOccupation: form.motherOccupation || undefined,
          address: form.address || undefined,
        },
      };

      const result = await dispatch(createStudent(studentData));

      if (createStudent.fulfilled.match(result)) {
        toast.success('Student created successfully with QR code!');
        router.push(`/dashboard/admin/students/view/${result.payload.id}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create student');
      console.error('Create student error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Add New Student" 
        description="Create a new student profile with QR code generation"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Student Information
          </CardTitle>
          <CardDescription>
            Fill in all required fields. A unique QR code will be generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <div className="relative">
                    <Image 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      width={80} 
                      height={80} 
                      className="rounded-full object-cover border-2 border-primary"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a profile image (JPEG, PNG, WebP, GIF - max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    value={form.firstName} 
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    value={form.lastName} 
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    placeholder="Leave blank for default (password123)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <select
                    id="bloodGroup"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={form.dateOfBirth} 
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input 
                    id="emergencyContact" 
                    value={form.emergencyContact} 
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input 
                    id="rollNumber" 
                    value={form.rollNumber} 
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">Admission Number *</Label>
                  <Input 
                    id="admissionNumber" 
                    value={form.admissionNumber} 
                    onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class *</Label>
                  <select
                    id="classId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    required
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((num) => (
                      <option key={num} value={num}>Class {num}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectionId">Section *</Label>
                  <select
                    id="sectionId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    required
                  >
                    {['A','B','C','D','E'].map((section, index) => (
                      <option key={section} value={index + 1}>Section {section}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date *</Label>
                  <Input 
                    id="admissionDate" 
                    type="date" 
                    value={form.admissionDate} 
                    onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Parent Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input 
                    id="fatherName" 
                    value={form.fatherName} 
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input 
                    id="motherName" 
                    value={form.motherName} 
                    onChange={(e) => setForm({ ...form, motherName: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherPhone">Father's Phone</Label>
                  <Input 
                    id="fatherPhone" 
                    value={form.fatherPhone} 
                    onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherPhone">Mother's Phone</Label>
                  <Input 
                    id="motherPhone" 
                    value={form.motherPhone} 
                    onChange={(e) => setForm({ ...form, motherPhone: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                  <Input 
                    id="fatherOccupation" 
                    value={form.fatherOccupation} 
                    onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                  <Input 
                    id="motherOccupation" 
                    value={form.motherOccupation} 
                    onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })} 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={form.address} 
                    onChange={(e) => setForm({ ...form, address: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={isLoading || uploading} className="flex-1">
                {uploading || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  'Create Student with QR Code'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}