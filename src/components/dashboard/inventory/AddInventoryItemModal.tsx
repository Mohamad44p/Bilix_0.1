"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Badge } from "../../../components/ui/badge";
import { useToast } from "../../../components/ui/use-toast";
import { createInventoryItem } from "../../../lib/services/inventory-service";

interface AddInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  currentQuantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  unitOfMeasure: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInventoryItemModal({
  open,
  onOpenChange,
  onSuccess,
}: AddInventoryItemModalProps) {
  const [attributes, setAttributes] = useState<{ name: string; value: string }[]>([]);
  const [attrName, setAttrName] = useState("");
  const [attrValue, setAttrValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      description: "",
      sku: "",
      currentQuantity: 0,
      unitOfMeasure: "units",
      category: "",
    },
  });

  const handleAddAttribute = () => {
    if (attrName.trim() && attrValue.trim()) {
      setAttributes([...attributes, { name: attrName.trim(), value: attrValue.trim() }]);
      setAttrName("");
      setAttrValue("");
    }
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const userId = "test-user-id"; // This would normally come from auth context
      
      await createInventoryItem(userId, {
        ...data,
        attributes,
      });
      
      toast({
        title: "Item added",
        description: `${data.productName} has been added to inventory`,
      });
      
      form.reset();
      setAttributes([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add inventory item:", error);
      toast({
        title: "Error adding item",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  type FieldRenderProps = {
    field: {
      value: any;
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
      onBlur: () => void;
      name: string;
      ref: React.RefObject<any>;
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }: FieldRenderProps) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }: FieldRenderProps) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }: FieldRenderProps) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }: FieldRenderProps) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }: FieldRenderProps) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }: FieldRenderProps) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                      <Input placeholder="units" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Attributes</FormLabel>
              <div className="flex gap-2">
                <Input 
                  placeholder="Name (e.g. color)" 
                  value={attrName} 
                  onChange={(e) => setAttrName(e.target.value)}
                  className="flex-1"
                />
                <Input 
                  placeholder="Value (e.g. red)" 
                  value={attrValue} 
                  onChange={(e) => setAttrValue(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={handleAddAttribute}
                  disabled={!attrName.trim() || !attrValue.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {attributes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attributes.map((attr, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <span className="font-medium">{attr.name}:</span> {attr.value}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 p-0" 
                        onClick={() => handleRemoveAttribute(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : null}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
