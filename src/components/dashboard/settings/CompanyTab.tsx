"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CompanyTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [companyForm, setCompanyForm] = useState({
    name: "Acme Inc.",
    taxId: "AB-12345678",
    address: "123 Main Street",
    city: "San Francisco",
    state: "California",
    zip: "94103",
    country: "United States",
    phone: "+1 (415) 555-1234"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveCompanyInfo = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Company information saved",
        description: "Your company details have been updated successfully."
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company details and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input 
                id="companyName" 
                name="name"
                placeholder="Acme Inc." 
                value={companyForm.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input 
                id="taxId" 
                name="taxId"
                placeholder="Tax ID" 
                value={companyForm.taxId}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input 
                id="companyAddress" 
                name="address"
                placeholder="123 Street" 
                value={companyForm.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">City</Label>
              <Input 
                id="companyCity" 
                name="city"
                placeholder="City" 
                value={companyForm.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState">State/Province</Label>
              <Input 
                id="companyState" 
                name="state"
                placeholder="State" 
                value={companyForm.state}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyZip">ZIP/Postal code</Label>
              <Input 
                id="companyZip" 
                name="zip"
                placeholder="ZIP" 
                value={companyForm.zip}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCountry">Country</Label>
              <Input 
                id="companyCountry" 
                name="country"
                placeholder="Country" 
                value={companyForm.country}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input 
                id="companyPhone" 
                name="phone"
                placeholder="Phone" 
                value={companyForm.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="ml-auto" 
            onClick={saveCompanyInfo}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanyTab; 