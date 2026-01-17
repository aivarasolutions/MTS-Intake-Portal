import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronLeft, ChevronRight, Check, User, Users, Home, MapPin, Save, Baby, Building2, DollarSign, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ClientLayout } from "@/components/layouts/client-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "Washington DC" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "stepson", label: "Stepson" },
  { value: "stepdaughter", label: "Stepdaughter" },
  { value: "foster_child", label: "Foster Child" },
  { value: "grandchild", label: "Grandchild" },
  { value: "niece", label: "Niece" },
  { value: "nephew", label: "Nephew" },
  { value: "parent", label: "Parent" },
  { value: "grandparent", label: "Grandparent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other Relative" },
];

const TAX_AUTHORITY_OPTIONS = [
  { value: "federal", label: "Federal (IRS)" },
  { value: "resident_state", label: "State" },
  { value: "resident_city", label: "City/Local" },
];

const PAYMENT_PERIOD_OPTIONS = [
  { value: "overpayment_2024", label: "2024 Overpayment Applied" },
  { value: "q1", label: "Q1 (Apr 15)" },
  { value: "q2", label: "Q2 (Jun 15)" },
  { value: "q3", label: "Q3 (Sep 15)" },
  { value: "q4", label: "Q4 (Jan 15)" },
  { value: "additional", label: "Additional Payment" },
];

const taxpayerSchema = z.object({
  taxpayer_first_name: z.string().min(1, "First name is required").max(50),
  taxpayer_middle_initial: z.string().max(1).optional().or(z.literal("")),
  taxpayer_last_name: z.string().min(1, "Last name is required").max(50),
  taxpayer_dob: z.string().min(1, "Date of birth is required"),
  taxpayer_ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "Enter a valid SSN (XXX-XX-XXXX)").optional().or(z.literal("")),
  taxpayer_ip_pin: z.string().max(6).optional().or(z.literal("")),
  taxpayer_occupation: z.string().max(100).optional().or(z.literal("")),
  taxpayer_phone: z.string().regex(/^(\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, "Enter a valid phone number").optional().or(z.literal("")),
  taxpayer_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

const spouseSchema = z.object({
  spouse_first_name: z.string().max(50).optional().or(z.literal("")),
  spouse_middle_initial: z.string().max(1).optional().or(z.literal("")),
  spouse_last_name: z.string().max(50).optional().or(z.literal("")),
  spouse_dob: z.string().optional().or(z.literal("")),
  spouse_ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "Enter a valid SSN (XXX-XX-XXXX)").optional().or(z.literal("")),
  spouse_ip_pin: z.string().max(6).optional().or(z.literal("")),
  spouse_occupation: z.string().max(100).optional().or(z.literal("")),
  spouse_phone: z.string().regex(/^(\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, "Enter a valid phone number").optional().or(z.literal("")),
  spouse_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

const addressSchema = z.object({
  address_street: z.string().min(1, "Street address is required").max(200),
  address_apt: z.string().max(20).optional().or(z.literal("")),
  address_city: z.string().min(1, "City is required").max(100),
  address_state: z.string().min(2, "State is required").max(2),
  address_zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
});

const residencySchema = z.object({
  resident_state: z.string().max(2).optional().or(z.literal("")),
  resident_city: z.string().max(100).optional().or(z.literal("")),
  school_district: z.string().max(100).optional().or(z.literal("")),
  county: z.string().max(100).optional().or(z.literal("")),
});

type TaxpayerData = z.infer<typeof taxpayerSchema>;
type SpouseData = z.infer<typeof spouseSchema>;
type AddressData = z.infer<typeof addressSchema>;
type ResidencyData = z.infer<typeof residencySchema>;

interface DependentForm {
  first_name: string;
  last_name: string;
  ssn: string;
  relationship: string;
  months_lived_with: string;
  dob: string;
  is_student: boolean;
  is_disabled: boolean;
  provides_over_half_support: boolean;
}

interface ChildcareForm {
  provider_name: string;
  provider_address: string;
  provider_city: string;
  provider_state: string;
  provider_zip: string;
  provider_ein: string;
  amount_paid: string;
}

interface EstimatedPaymentForm {
  tax_authority: string;
  payment_period: string;
  amount: string;
  date_paid: string;
}

const STEPS = [
  { id: 1, title: "Your Information", description: "Personal details", icon: User },
  { id: 2, title: "Spouse Information", description: "If married filing jointly", icon: Users },
  { id: 3, title: "Address", description: "Current mailing address", icon: Home },
  { id: 4, title: "Residency", description: "State and local info", icon: MapPin },
  { id: 5, title: "Dependents", description: "Children and relatives", icon: Baby },
  { id: 6, title: "Childcare", description: "Childcare providers", icon: Building2 },
  { id: 7, title: "Estimated Payments", description: "Quarterly tax payments", icon: DollarSign },
];

function StepIndicator({ currentStep, steps, completedSteps }: { currentStep: number; steps: typeof STEPS; completedSteps: Set<number> }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-1 text-center max-w-[60px] hidden md:block ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 md:mx-2 min-w-[8px] ${completedSteps.has(step.id) ? "bg-primary" : "bg-muted-foreground/30"}`} />
              )}
            </div>
          );
        })}
      </div>
      <Progress value={(currentStep / steps.length) * 100} className="h-2" />
    </div>
  );
}

function TaxpayerStep({ form, onSave, isSaving }: { form: any; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="taxpayer_first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-taxpayer-first-name" placeholder="John" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxpayer_middle_initial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>M.I.</FormLabel>
              <FormControl>
                <Input {...field} maxLength={1} data-testid="input-taxpayer-middle-initial" placeholder="A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxpayer_last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-taxpayer-last-name" placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taxpayer_dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth *</FormLabel>
              <FormControl>
                <Input {...field} type="date" data-testid="input-taxpayer-dob" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxpayer_ssn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Security Number</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-taxpayer-ssn" placeholder="XXX-XX-XXXX" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taxpayer_ip_pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IRS IP PIN (if applicable)</FormLabel>
              <FormControl>
                <Input {...field} maxLength={6} data-testid="input-taxpayer-ip-pin" placeholder="6-digit PIN" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxpayer_occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-taxpayer-occupation" placeholder="Software Engineer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taxpayer_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} type="tel" data-testid="input-taxpayer-phone" placeholder="(555) 123-4567" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxpayer_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input {...field} type="email" data-testid="input-taxpayer-email" placeholder="john@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onSave} disabled={isSaving} data-testid="button-save-taxpayer">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Progress
        </Button>
      </div>
    </div>
  );
}

function SpouseStep({ form, onSave, isSaving }: { form: any; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        If you are filing jointly with a spouse, please provide their information below. Leave blank if not applicable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="spouse_first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-spouse-first-name" placeholder="Jane" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spouse_middle_initial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>M.I.</FormLabel>
              <FormControl>
                <Input {...field} maxLength={1} data-testid="input-spouse-middle-initial" placeholder="B" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spouse_last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-spouse-last-name" placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="spouse_dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input {...field} type="date" data-testid="input-spouse-dob" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spouse_ssn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Security Number</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-spouse-ssn" placeholder="XXX-XX-XXXX" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="spouse_ip_pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IRS IP PIN (if applicable)</FormLabel>
              <FormControl>
                <Input {...field} maxLength={6} data-testid="input-spouse-ip-pin" placeholder="6-digit PIN" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spouse_occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-spouse-occupation" placeholder="Teacher" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="spouse_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} type="tel" data-testid="input-spouse-phone" placeholder="(555) 123-4567" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spouse_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input {...field} type="email" data-testid="input-spouse-email" placeholder="jane@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onSave} disabled={isSaving} data-testid="button-save-spouse">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Progress
        </Button>
      </div>
    </div>
  );
}

function AddressStep({ form, onSave, isSaving }: { form: any; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="address_street"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address *</FormLabel>
            <FormControl>
              <Input {...field} data-testid="input-address-street" placeholder="123 Main Street" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address_apt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apt / Suite / Unit</FormLabel>
            <FormControl>
              <Input {...field} data-testid="input-address-apt" placeholder="Apt 4B" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="address_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-address-city" placeholder="New York" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-address-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address_zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-address-zip" placeholder="10001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onSave} disabled={isSaving} data-testid="button-save-address">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Progress
        </Button>
      </div>
    </div>
  );
}

function ResidencyStep({ form, onSave, isSaving }: { form: any; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This information helps determine state and local tax obligations. Fill in what applies to you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="resident_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resident State (if different from mailing)</FormLabel>
              <Select onValueChange={(val) => field.onChange(val === "_same" ? "" : val)} value={field.value || "_same"}>
                <FormControl>
                  <SelectTrigger data-testid="select-resident-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_same">Same as mailing address</SelectItem>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="resident_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resident City (for local tax)</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-resident-city" placeholder="Columbus" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="school_district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School District</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-school-district" placeholder="District name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="county"
          render={({ field }) => (
            <FormItem>
              <FormLabel>County</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-county" placeholder="Franklin" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onSave} disabled={isSaving} data-testid="button-save-residency">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Progress
        </Button>
      </div>
    </div>
  );
}

function DependentsStep({ 
  intakeId, 
  dependents, 
  onRefresh 
}: { 
  intakeId: string; 
  dependents: any[]; 
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newDependent, setNewDependent] = useState<DependentForm>({
    first_name: "",
    last_name: "",
    ssn: "",
    relationship: "",
    months_lived_with: "12",
    dob: "",
    is_student: false,
    is_disabled: false,
    provides_over_half_support: true,
  });

  const addMutation = useMutation({
    mutationFn: async (data: DependentForm) => {
      return apiRequest("POST", `/api/intakes/${intakeId}/dependents`, data);
    },
    onSuccess: () => {
      onRefresh();
      setIsAdding(false);
      setNewDependent({
        first_name: "",
        last_name: "",
        ssn: "",
        relationship: "",
        months_lived_with: "12",
        dob: "",
        is_student: false,
        is_disabled: false,
        provides_over_half_support: true,
      });
      toast({ title: "Dependent added", description: "The dependent has been added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add dependent", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (dependentId: string) => {
      return apiRequest("DELETE", `/api/dependents/${dependentId}`);
    },
    onSuccess: () => {
      onRefresh();
      toast({ title: "Dependent removed", description: "The dependent has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove dependent", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!newDependent.first_name || !newDependent.last_name) {
      toast({ title: "Required fields", description: "Please enter the dependent's first and last name.", variant: "destructive" });
      return;
    }
    addMutation.mutate(newDependent);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add information about your dependents (children, relatives) who you will claim on your tax return.
      </p>

      {dependents.length > 0 && (
        <div className="space-y-3">
          {dependents.map((dep: any) => (
            <Card key={dep.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{dep.first_name} {dep.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {dep.relationship && RELATIONSHIP_OPTIONS.find(r => r.value === dep.relationship)?.label}
                    {dep.dob && ` • Born ${new Date(dep.dob).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(dep.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-dependent-${dep.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdding ? (
        <Card className="p-4 border-primary/50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={newDependent.first_name}
                  onChange={(e) => setNewDependent({ ...newDependent, first_name: e.target.value })}
                  placeholder="First name"
                  data-testid="input-dependent-first-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={newDependent.last_name}
                  onChange={(e) => setNewDependent({ ...newDependent, last_name: e.target.value })}
                  placeholder="Last name"
                  data-testid="input-dependent-last-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">SSN</label>
                <Input
                  value={newDependent.ssn}
                  onChange={(e) => setNewDependent({ ...newDependent, ssn: e.target.value })}
                  placeholder="XXX-XX-XXXX"
                  data-testid="input-dependent-ssn"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={newDependent.dob}
                  onChange={(e) => setNewDependent({ ...newDependent, dob: e.target.value })}
                  data-testid="input-dependent-dob"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Select
                  value={newDependent.relationship || "_none"}
                  onValueChange={(val) => setNewDependent({ ...newDependent, relationship: val === "_none" ? "" : val })}
                >
                  <SelectTrigger data-testid="select-dependent-relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select relationship</SelectItem>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Months Lived With You</label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={newDependent.months_lived_with}
                  onChange={(e) => setNewDependent({ ...newDependent, months_lived_with: e.target.value })}
                  data-testid="input-dependent-months"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={newDependent.is_student}
                  onCheckedChange={(checked) => setNewDependent({ ...newDependent, is_student: !!checked })}
                  data-testid="checkbox-dependent-student"
                />
                Full-time student
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={newDependent.is_disabled}
                  onCheckedChange={(checked) => setNewDependent({ ...newDependent, is_disabled: !!checked })}
                  data-testid="checkbox-dependent-disabled"
                />
                Disabled
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} data-testid="button-cancel-dependent">
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-save-dependent">
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Dependent
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)} className="w-full" data-testid="button-add-dependent">
          <Plus className="mr-2 h-4 w-4" />
          Add Dependent
        </Button>
      )}
    </div>
  );
}

function ChildcareStep({ 
  intakeId, 
  providers, 
  onRefresh 
}: { 
  intakeId: string; 
  providers: any[]; 
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newProvider, setNewProvider] = useState<ChildcareForm>({
    provider_name: "",
    provider_address: "",
    provider_city: "",
    provider_state: "",
    provider_zip: "",
    provider_ein: "",
    amount_paid: "",
  });

  const addMutation = useMutation({
    mutationFn: async (data: ChildcareForm) => {
      return apiRequest("POST", `/api/intakes/${intakeId}/childcare`, data);
    },
    onSuccess: () => {
      onRefresh();
      setIsAdding(false);
      setNewProvider({
        provider_name: "",
        provider_address: "",
        provider_city: "",
        provider_state: "",
        provider_zip: "",
        provider_ein: "",
        amount_paid: "",
      });
      toast({ title: "Provider added", description: "The childcare provider has been added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add provider", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiRequest("DELETE", `/api/childcare/${providerId}`);
    },
    onSuccess: () => {
      onRefresh();
      toast({ title: "Provider removed", description: "The childcare provider has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove provider", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!newProvider.provider_name) {
      toast({ title: "Required fields", description: "Please enter the provider's name.", variant: "destructive" });
      return;
    }
    if (!newProvider.amount_paid || parseFloat(newProvider.amount_paid) <= 0) {
      toast({ title: "Required fields", description: "Amount paid must be greater than 0.", variant: "destructive" });
      return;
    }
    addMutation.mutate(newProvider);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add information about childcare providers (daycare, nanny, after-school care) for dependent children under 13.
      </p>

      {providers.length > 0 && (
        <div className="space-y-3">
          {providers.map((prov: any) => (
            <Card key={prov.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{prov.provider_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {prov.provider_city && `${prov.provider_city}, ${prov.provider_state}`}
                    {prov.amount_paid && ` • $${parseFloat(prov.amount_paid).toLocaleString()} paid`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(prov.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-provider-${prov.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdding ? (
        <Card className="p-4 border-primary/50">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Provider Name *</label>
              <Input
                value={newProvider.provider_name}
                onChange={(e) => setNewProvider({ ...newProvider, provider_name: e.target.value })}
                placeholder="ABC Daycare Center"
                data-testid="input-provider-name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Street Address</label>
              <Input
                value={newProvider.provider_address}
                onChange={(e) => setNewProvider({ ...newProvider, provider_address: e.target.value })}
                placeholder="123 Care Street"
                data-testid="input-provider-address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={newProvider.provider_city}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_city: e.target.value })}
                  placeholder="City"
                  data-testid="input-provider-city"
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Select
                  value={newProvider.provider_state || "_none"}
                  onValueChange={(val) => setNewProvider({ ...newProvider, provider_state: val === "_none" ? "" : val })}
                >
                  <SelectTrigger data-testid="select-provider-state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select state</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <Input
                  value={newProvider.provider_zip}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_zip: e.target.value })}
                  placeholder="12345"
                  data-testid="input-provider-zip"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Provider SSN or EIN</label>
                <Input
                  value={newProvider.provider_ein}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_ein: e.target.value })}
                  placeholder="XX-XXXXXXX"
                  data-testid="input-provider-ein"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount Paid *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProvider.amount_paid}
                  onChange={(e) => setNewProvider({ ...newProvider, amount_paid: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-provider-amount"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} data-testid="button-cancel-provider">
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-save-provider">
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Provider
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)} className="w-full" data-testid="button-add-provider">
          <Plus className="mr-2 h-4 w-4" />
          Add Childcare Provider
        </Button>
      )}
    </div>
  );
}

function EstimatedPaymentsStep({ 
  intakeId, 
  payments, 
  onRefresh 
}: { 
  intakeId: string; 
  payments: any[]; 
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newPayment, setNewPayment] = useState<EstimatedPaymentForm>({
    tax_authority: "federal",
    payment_period: "q1",
    amount: "",
    date_paid: "",
  });

  const addMutation = useMutation({
    mutationFn: async (data: EstimatedPaymentForm) => {
      return apiRequest("POST", `/api/intakes/${intakeId}/estimated-payments`, data);
    },
    onSuccess: () => {
      onRefresh();
      setIsAdding(false);
      setNewPayment({
        tax_authority: "federal",
        payment_period: "q1",
        amount: "",
        date_paid: "",
      });
      toast({ title: "Payment added", description: "The estimated payment has been added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add payment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return apiRequest("DELETE", `/api/estimated-payments/${paymentId}`);
    },
    onSuccess: () => {
      onRefresh();
      toast({ title: "Payment removed", description: "The estimated payment has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove payment", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) < 0) {
      toast({ title: "Required fields", description: "Please enter a valid payment amount.", variant: "destructive" });
      return;
    }
    addMutation.mutate(newPayment);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add any estimated tax payments you made during the tax year (quarterly payments, overpayment applied from prior year).
      </p>

      {payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((pmt: any) => (
            <Card key={pmt.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {TAX_AUTHORITY_OPTIONS.find(t => t.value === pmt.tax_authority)?.label || pmt.tax_authority}
                    {" - "}
                    {PAYMENT_PERIOD_OPTIONS.find(p => p.value === pmt.payment_period)?.label || pmt.payment_period}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${parseFloat(pmt.amount).toLocaleString()}
                    {pmt.date_paid && ` • Paid ${new Date(pmt.date_paid).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(pmt.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-payment-${pmt.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdding ? (
        <Card className="p-4 border-primary/50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tax Authority *</label>
                <Select
                  value={newPayment.tax_authority}
                  onValueChange={(val) => setNewPayment({ ...newPayment, tax_authority: val })}
                >
                  <SelectTrigger data-testid="select-payment-authority">
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_AUTHORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Period *</label>
                <Select
                  value={newPayment.payment_period}
                  onValueChange={(val) => setNewPayment({ ...newPayment, payment_period: val })}
                >
                  <SelectTrigger data-testid="select-payment-period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-payment-amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date Paid</label>
                <Input
                  type="date"
                  value={newPayment.date_paid}
                  onChange={(e) => setNewPayment({ ...newPayment, date_paid: e.target.value })}
                  data-testid="input-payment-date"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} data-testid="button-cancel-payment">
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-save-payment">
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Payment
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)} className="w-full" data-testid="button-add-payment">
          <Plus className="mr-2 h-4 w-4" />
          Add Estimated Payment
        </Button>
      )}
    </div>
  );
}

export default function IntakeWizard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data: intake, isLoading: intakeLoading, refetch: refetchIntake } = useQuery<any>({
    queryKey: ["/api/intakes", id],
    enabled: !!id,
  });

  const { data: taxpayerInfo, isLoading: infoLoading } = useQuery({
    queryKey: ["/api/intakes", id, "taxpayer-info"],
    queryFn: async () => {
      const response = await fetch(`/api/intakes/${id}/taxpayer-info`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    enabled: !!id,
  });

  const form = useForm({
    resolver: zodResolver(
      taxpayerSchema.merge(spouseSchema).merge(addressSchema).merge(residencySchema).partial()
    ),
    defaultValues: {
      taxpayer_first_name: "",
      taxpayer_middle_initial: "",
      taxpayer_last_name: "",
      taxpayer_dob: "",
      taxpayer_ssn: "",
      taxpayer_ip_pin: "",
      taxpayer_occupation: "",
      taxpayer_phone: "",
      taxpayer_email: "",
      spouse_first_name: "",
      spouse_middle_initial: "",
      spouse_last_name: "",
      spouse_dob: "",
      spouse_ssn: "",
      spouse_ip_pin: "",
      spouse_occupation: "",
      spouse_phone: "",
      spouse_email: "",
      address_street: "",
      address_apt: "",
      address_city: "",
      address_state: "",
      address_zip: "",
      resident_state: "",
      resident_city: "",
      school_district: "",
      county: "",
    },
  });

  useEffect(() => {
    if (taxpayerInfo) {
      const dateToString = (d: any) => {
        if (!d) return "";
        const date = new Date(d);
        return date.toISOString().split("T")[0];
      };

      form.reset({
        taxpayer_first_name: taxpayerInfo.taxpayer_first_name || "",
        taxpayer_middle_initial: taxpayerInfo.taxpayer_middle_initial || "",
        taxpayer_last_name: taxpayerInfo.taxpayer_last_name || "",
        taxpayer_dob: dateToString(taxpayerInfo.taxpayer_dob),
        taxpayer_ssn: "",
        taxpayer_ip_pin: "",
        taxpayer_occupation: taxpayerInfo.taxpayer_occupation || "",
        taxpayer_phone: taxpayerInfo.taxpayer_phone || "",
        taxpayer_email: taxpayerInfo.taxpayer_email || "",
        spouse_first_name: taxpayerInfo.spouse_first_name || "",
        spouse_middle_initial: taxpayerInfo.spouse_middle_initial || "",
        spouse_last_name: taxpayerInfo.spouse_last_name || "",
        spouse_dob: dateToString(taxpayerInfo.spouse_dob),
        spouse_ssn: "",
        spouse_ip_pin: "",
        spouse_occupation: taxpayerInfo.spouse_occupation || "",
        spouse_phone: taxpayerInfo.spouse_phone || "",
        spouse_email: taxpayerInfo.spouse_email || "",
        address_street: taxpayerInfo.address_street || "",
        address_apt: taxpayerInfo.address_apt || "",
        address_city: taxpayerInfo.address_city || "",
        address_state: taxpayerInfo.address_state || "",
        address_zip: taxpayerInfo.address_zip || "",
        resident_state: taxpayerInfo.resident_state || "",
        resident_city: taxpayerInfo.resident_city || "",
        school_district: taxpayerInfo.school_district || "",
        county: taxpayerInfo.county || "",
      });

      const completed = new Set<number>();
      if (taxpayerInfo.taxpayer_first_name && taxpayerInfo.taxpayer_last_name && taxpayerInfo.taxpayer_dob) {
        completed.add(1);
      }
      completed.add(2);
      if (taxpayerInfo.address_street && taxpayerInfo.address_city && taxpayerInfo.address_state && taxpayerInfo.address_zip) {
        completed.add(3);
      }
      completed.add(4);
      setCompletedSteps(completed);
    }
  }, [taxpayerInfo, form]);


  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/intakes/${id}/taxpayer-info`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intakes", id, "taxpayer-info"] });
      toast({
        title: "Progress saved",
        description: "Your information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save your information.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const values = form.getValues();
    const filteredValues: Record<string, any> = {};
    
    Object.entries(values).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        filteredValues[key] = value;
      }
    });

    saveMutation.mutate(filteredValues);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["taxpayer_first_name", "taxpayer_last_name", "taxpayer_dob"];
        break;
      case 2:
        return true;
      case 3:
        fieldsToValidate = ["address_street", "address_city", "address_state", "address_zip"];
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        return true;
    }

    const result = await form.trigger(fieldsToValidate as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep <= 4) {
      handleSave();
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required fields before finishing.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep <= 4) {
      handleSave();
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    
    toast({
      title: "Intake complete!",
      description: "All information has been saved. You can continue to review or submit.",
    });
    
    navigate("/dashboard/client");
  };

  const handleRefreshIntake = () => {
    refetchIntake();
    queryClient.invalidateQueries({ queryKey: ["/api/intakes", id] });
  };

  if (intakeLoading || infoLoading) {
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!intake) {
    return (
      <ClientLayout>
        <div className="py-8">
          <div className="max-w-3xl mx-auto px-4">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Intake not found.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/client")} data-testid="button-back-dashboard">
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <ClientLayout>
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard/client")} data-testid="button-back">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Year {intake.tax_year} - {currentStepInfo.title}</CardTitle>
              <CardDescription>
                {currentStepInfo.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StepIndicator currentStep={currentStep} steps={STEPS} completedSteps={completedSteps} />

              <Form {...form}>
                <form>
                  {currentStep === 1 && (
                    <TaxpayerStep form={form} onSave={handleSave} isSaving={saveMutation.isPending} />
                  )}
                  {currentStep === 2 && (
                    <SpouseStep form={form} onSave={handleSave} isSaving={saveMutation.isPending} />
                  )}
                  {currentStep === 3 && (
                    <AddressStep form={form} onSave={handleSave} isSaving={saveMutation.isPending} />
                  )}
                  {currentStep === 4 && (
                    <ResidencyStep form={form} onSave={handleSave} isSaving={saveMutation.isPending} />
                  )}
                  {currentStep === 5 && (
                    <DependentsStep 
                      intakeId={id!} 
                      dependents={intake.dependents || []} 
                      onRefresh={handleRefreshIntake}
                    />
                  )}
                  {currentStep === 6 && (
                    <ChildcareStep 
                      intakeId={id!} 
                      providers={intake.childcare_providers || []} 
                      onRefresh={handleRefreshIntake}
                    />
                  )}
                  {currentStep === 7 && (
                    <EstimatedPaymentsStep 
                      intakeId={id!} 
                      payments={intake.estimated_payments || []} 
                      onRefresh={handleRefreshIntake}
                    />
                  )}

                  <div className="flex justify-between mt-8 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                      data-testid="button-prev-step"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button type="button" onClick={handleNext} data-testid="button-next-step">
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="button" onClick={handleComplete} data-testid="button-complete">
                        <Check className="mr-2 h-4 w-4" />
                        Complete Intake
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
}
