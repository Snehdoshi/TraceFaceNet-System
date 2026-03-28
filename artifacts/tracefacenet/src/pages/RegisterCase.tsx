import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button, Textarea, Badge } from "@/components/ui";
import { useCreatePersonMutation } from "@/hooks/use-api-mutations";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FilePlus, User } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0).max(120),
  gender: z.enum(["male", "female", "other", "unknown"]),
  description: z.string().optional(),
  lastSeenLocation: z.string().min(2, "Location is required"),
  lastSeenDate: z.string().min(1, "Date is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z.string().min(5, "Contact phone is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function RegisterCase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mutation = useCreatePersonMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "unknown",
    }
  });

  const onSubmit = (data: FormData) => {
    // clean empty strings
    const payload = {
      ...data,
      contactEmail: data.contactEmail || undefined,
      photoUrl: data.photoUrl || undefined,
    };
    
    mutation.mutate(payload, {
      onSuccess: (res) => {
        toast({
          title: "Case Registered Successfully",
          description: `Case ID ${res.caseNumber} generated.`,
        });
        setLocation(`/missing-persons/${res.id}`);
      },
      onError: (err) => {
        toast({
          title: "Registration Failed",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <FilePlus className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Log New Case</h1>
            <p className="text-muted-foreground">Register a new missing person into the biometric database.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary" />
                    Subject Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" {...register("name")} placeholder="John Doe" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input id="age" type="number" {...register("age")} placeholder="25" />
                        {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <select 
                          id="gender" 
                          {...register("gender")}
                          className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 neon-border text-foreground"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Physical Description & Identifiers</Label>
                    <Textarea 
                      id="description" 
                      {...register("description")} 
                      placeholder="Height, weight, clothing worn, distinct features..." 
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastSeenLocation">Last Seen Location *</Label>
                      <Input id="lastSeenLocation" {...register("lastSeenLocation")} placeholder="123 Main St, City" />
                      {errors.lastSeenLocation && <p className="text-xs text-destructive">{errors.lastSeenLocation.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastSeenDate">Last Seen Date & Time *</Label>
                      <Input id="lastSeenDate" type="datetime-local" {...register("lastSeenDate")} />
                      {errors.lastSeenDate && <p className="text-xs text-destructive">{errors.lastSeenDate.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-warning" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input id="contactName" {...register("contactName")} placeholder="Jane Doe" />
                      {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input id="contactPhone" {...register("contactPhone")} placeholder="+1 (555) 000-0000" />
                      {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                    <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="jane@example.com" />
                    {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Biometric Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Reference Photo URL</Label>
                    <Input id="photoUrl" {...register("photoUrl")} placeholder="https://..." />
                    {errors.photoUrl && <p className="text-xs text-destructive">{errors.photoUrl.message}</p>}
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Notice</p>
                    Provide a clear, front-facing photo URL. The system will automatically generate face embeddings upon registration for future matching.
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
                      Register Case to Database
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
