"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CirclePlus, Edit, Trash2, Loader2, Search, X, Globe, Phone, Mail, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define Vendor type based on our Prisma schema
interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: '',
    logoUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Fetch all vendors from the API
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendors');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search query
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.phone && vendor.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.address && vendor.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.notes && vendor.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset the form data
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      notes: '',
      logoUrl: '',
    });
  };

  // Set form data when editing a vendor
  const handleEditClick = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      address: vendor.address || '',
      notes: vendor.notes || '',
      logoUrl: vendor.logoUrl || '',
    });
    setIsEditOpen(true);
  };

  // Set current vendor when deleting
  const handleDeleteClick = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setIsDeleteOpen(true);
  };

  // Create a new vendor
  const handleCreateVendor = async () => {
    if (!formData.name.trim()) {
        toast.error('Vendor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create vendor');
      }

      await fetchVendors();
      setIsCreateOpen(false);
      resetForm();
      toast.success('Vendor created successfully');
    } catch (error: unknown) {
      console.error('Error creating vendor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create vendor';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing vendor
  const handleUpdateVendor = async () => {
    if (!currentVendor) return;
    
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendors/${currentVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update vendor');
      }

      await fetchVendors();
      setIsEditOpen(false);
      setCurrentVendor(null);
      resetForm();
      toast.success('Vendor updated successfully');
    } catch (error: unknown) {
      console.error('Error updating vendor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update vendor';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a vendor
  const handleDeleteVendor = async () => {
    if (!currentVendor) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendors/${currentVendor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete vendor');
      }

      await fetchVendors();
      setIsDeleteOpen(false);
      setCurrentVendor(null);
      toast.success('Vendor deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting vendor:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete vendor';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Vendors Management</CardTitle>
            <CardDescription>
              Create and manage vendors for your invoices
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-9 w-9 rounded-l-none p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CirclePlus className="mr-2 h-4 w-4" /> Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Vendor</DialogTitle>
                  <DialogDescription>
                    Add a new vendor to track in your invoices
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Acme Corporation"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right">
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main St, City, Country"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="logoUrl" className="text-right">
                      Logo URL
                    </Label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Additional information about this vendor"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="col-span-3 min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVendor} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Vendor"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No vendors found</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" /> Create your first vendor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Website</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        {vendor.logoUrl ? (
                          <AvatarImage src={vendor.logoUrl} alt={vendor.name} />
                        ) : null}
                        <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{vendor.name}</div>
                      {vendor.address && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[200px]">{vendor.address}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {vendor.email && (
                        <div className="flex items-center text-sm mb-1">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {vendor.website ? (
                        <a 
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:underline"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[150px]">
                            {vendor.website.replace(/https?:\/\//i, '')}
                          </span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(vendor)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Update the details of your vendor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="e.g., Acme Corporation"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                placeholder="contact@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-website"
                name="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address
              </Label>
              <Input
                id="edit-address"
                name="address"
                placeholder="123 Main St, City, Country"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-logoUrl" className="text-right">
                Logo URL
              </Label>
              <Input
                id="edit-logoUrl"
                name="logoUrl"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-notes" className="text-right pt-2">
                Notes
              </Label>
              <Input
                id="edit-notes"
                name="notes"
                placeholder="Additional information about this vendor"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVendor} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                {currentVendor?.logoUrl ? (
                  <AvatarImage src={currentVendor.logoUrl} alt={currentVendor.name} />
                ) : null}
                <AvatarFallback>{currentVendor ? getInitials(currentVendor.name) : ''}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentVendor?.name}</p>
                {currentVendor?.email && (
                  <p className="text-sm text-muted-foreground">{currentVendor.email}</p>
                )}
              </div>
            </div>
            {currentVendor?.address && (
              <p className="text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                {currentVendor.address}
              </p>
            )}
            {currentVendor?.notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                &quot;{currentVendor.notes}&quot;
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVendor} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Vendor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 