import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronLeft, ChevronRight, Check, User, Users, Home, MapPin, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClientLayout } from "@/components/layouts/client-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

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

const STEPS = [
  { id: 1, title: "Your Information", description: "Personal details", icon: User },
  { id: 2, title: "Spouse Information", description: "If married filing jointly", icon: Users },
  { id: 3, title: "Address", description: "Current mailing address", icon: Home },
  { id: 4, title: "Residency", description: "State and local info", icon: MapPin },
];

function StepIndicator({ currentStep, steps, completedSteps }: { currentStep: number; steps: typeof STEPS; completedSteps: Set<number> }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 text-center max-w-[80px] ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${completedSteps.has(step.id) ? "bg-primary" : "bg-muted-foreground/30"}`} />
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

export default function IntakeWizard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data: intake, isLoading: intakeLoading } = useQuery({
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

    handleSave();
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

    handleSave();
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    
    toast({
      title: "Section complete!",
      description: "Personal information has been saved. You can continue to the next section.",
    });
    
    navigate("/dashboard/client");
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
              <CardTitle>Tax Year {intake.tax_year} - Personal Information</CardTitle>
              <CardDescription>
                Complete your personal information to proceed with your tax preparation.
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
                        Complete Section
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
