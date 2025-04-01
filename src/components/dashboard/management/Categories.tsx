"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CirclePlus, Edit, Trash2, Loader2, Search, X, 
  // Import common icons from lucide-react
  Tag, Box, ShoppingCart, Briefcase, CreditCard, Home, 
  Car, Plane, Gift, Book, Coffee, Utensils, Laptop, Zap, 
  Droplet, Leaf, Heart, Star, PenTool
} from 'lucide-react';
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
import { useUser } from '@clerk/nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';

// Define error type
interface ApiError {
  message?: string;
  error?: string;
}

// Define Category type based on our Prisma schema
interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Icons mapping for select dropdown
const AVAILABLE_ICONS = {
  "tag": Tag,
  "box": Box,
  "shopping-cart": ShoppingCart,
  "briefcase": Briefcase,
  "credit-card": CreditCard,
  "home": Home,
  "car": Car,
  "plane": Plane,
  "gift": Gift,
  "book": Book,
  "coffee": Coffee,
  "utensils": Utensils,
  "laptop": Laptop,
  "zap": Zap,
  "droplet": Droplet,
  "leaf": Leaf,
  "heart": Heart,
  "star": Star,
  "pen-tool": PenTool
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366F1', // Default color
    icon: 'none',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  // Fetch categories on component mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCategories();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // Fetch all categories from the API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle icon selection
  const handleIconChange = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  // Reset the form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366F1',
      icon: 'none',
    });
  };

  // Set form data when editing a category
  const handleEditClick = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366F1',
      icon: category.icon || 'none',
    });
    setIsEditOpen(true);
  };

  // Set current category when deleting
  const handleDeleteClick = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteOpen(true);
  };

  // Create a new category
  const handleCreateCategory = async () => {
    if (!isSignedIn) {
      toast.error('You must be signed in to create a category');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.error || error.message || 'Failed to create category');
      }

      await fetchCategories();
      setIsCreateOpen(false);
      resetForm();
      toast.success('Category created successfully');
    } catch (error: unknown) {
      console.error('Error creating category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create category';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing category
  const handleUpdateCategory = async () => {
    if (!currentCategory) return;
    
    if (!isSignedIn) {
      toast.error('You must be signed in to update a category');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.error || error.message || 'Failed to update category');
      }

      await fetchCategories();
      setIsEditOpen(false);
      setCurrentCategory(null);
      resetForm();
      toast.success('Category updated successfully');
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update category';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a category
  const handleDeleteCategory = async () => {
    if (!currentCategory) return;

    if (!isSignedIn) {
      toast.error('You must be signed in to delete a category');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/categories/${currentCategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.error || error.message || 'Failed to delete category');
      }

      await fetchCategories();
      setIsDeleteOpen(false);
      setCurrentCategory(null);
      toast.success('Category deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the icon based on the icon name
  const renderIcon = (iconName: string | null) => {
    if (!iconName || iconName === "none") return <Tag className="h-4 w-4" />;
    
    const IconComponent = AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Tag className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Categories Management</CardTitle>
            <CardDescription>
              Create and manage categories for organizing your invoices
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search categories..."
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
                  <CirclePlus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category to organize your invoices
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
                      placeholder="e.g., Office Supplies"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Optional description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                      <div 
                        className="h-6 w-6 rounded-full border" 
                        style={{ backgroundColor: formData.color }}
                      />
                      <Input
                        id="color"
                        name="color"
                        type="color"
                        value={formData.color}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="icon" className="text-right">
                      Icon
                    </Label>
                    <div className="col-span-3">
                      <Select 
                        value={formData.icon} 
                        onValueChange={handleIconChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an icon">
                            {formData.icon && (
                              <div className="flex items-center">
                                {renderIcon(formData.icon)}
                                <span className="ml-2">{formData.icon}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            <SelectItem value="none">No icon</SelectItem>
                            {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
                              <SelectItem key={name} value={name}>
                                <div className="flex items-center">
                                  <Icon className="mr-2 h-4 w-4" />
                                  <span>{name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Category"
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
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No categories found</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" /> Create your first category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Icon</TableHead>
                  <TableHead className="w-[50px]">Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {renderIcon(category.icon)}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="h-6 w-6 rounded-full border" 
                        style={{ backgroundColor: category.color || "#6366F1" }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(category)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
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

      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details of your category
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
                placeholder="e.g., Office Supplies"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                name="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <div 
                  className="h-6 w-6 rounded-full border" 
                  style={{ backgroundColor: formData.color }}
                />
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-icon" className="text-right">
                Icon
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.icon} 
                  onValueChange={handleIconChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an icon">
                      {formData.icon && (
                        <div className="flex items-center">
                          {renderIcon(formData.icon)}
                          <span className="ml-2">{formData.icon}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      <SelectItem value="none">No icon</SelectItem>
                      {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isSubmitting}>
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

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                {currentCategory?.icon ? renderIcon(currentCategory.icon) : <Tag className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium">{currentCategory?.name}</p>
                {currentCategory?.description && (
                  <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 