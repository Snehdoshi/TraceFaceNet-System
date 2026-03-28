import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button, Textarea } from "@/components/ui";
import { useCreatePersonMutation } from "@/hooks/use-api-mutations";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FilePlus, User, Upload, Link as LinkIcon, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

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
  photoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type PhotoMode = "upload" | "url";

export default function RegisterCase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mutation = useCreatePersonMutation();

  const [photoMode, setPhotoMode] = useState<PhotoMode>("upload");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUrlInput, setPhotoUrlInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: "unknown" },
  });

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      setValue("photoUrl", result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhotoUrlInput(val);
    setPhotoPreview(val);
    setValue("photoUrl", val);
  };

  const clearPhoto = () => {
    setPhotoPreview("");
    setPhotoUrlInput("");
    setValue("photoUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const switchMode = (mode: PhotoMode) => {
    setPhotoMode(mode);
    clearPhoto();
  };

  const onSubmit = (data: FormData) => {
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
          variant: "destructive",
        });
      },
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
            {/* Left: Subject + Contact */}
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

            {/* Right: Biometric / Photo */}
            <div className="space-y-6">
              <Card className="border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Biometric Data</CardTitle>
                  {/* Mode toggle */}
                  <div className="flex rounded-lg border border-border/50 overflow-hidden bg-background/50 p-1 gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => switchMode("upload")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${photoMode === "upload" ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode("url")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${photoMode === "url" ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> URL
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {photoMode === "upload" ? (
                    <>
                      {!photoPreview ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${isDragging ? "border-primary bg-primary/10 scale-[0.99]" : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5"}`}
                        >
                          <ImagePlus className={`w-10 h-10 mb-2 transition-all ${isDragging ? "text-primary scale-110" : "text-muted-foreground/40 group-hover:text-primary/60"}`} />
                          <p className="text-xs font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors px-3">
                            {isDragging ? "Drop photo here" : "Click or drag to upload subject photo"}
                          </p>
                          <p className="text-xs text-muted-foreground/50 mt-1">JPG, PNG, WEBP</p>
                        </div>
                      ) : (
                        <div className="aspect-square relative rounded-lg overflow-hidden border border-border/50">
                          <img src={photoPreview} alt="Subject" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={clearPhoto}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-white transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                            <p className="text-xs text-muted-foreground text-center">Photo loaded — ready for embedding</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Reference Photo URL</Label>
                        <Input
                          placeholder="https://..."
                          value={photoUrlInput}
                          onChange={handleUrlInputChange}
                        />
                      </div>
                      {photoPreview && (
                        <div className="aspect-square relative rounded-lg overflow-hidden border border-border/50">
                          <img
                            src={photoPreview}
                            alt="Subject"
                            className="w-full h-full object-cover"
                            onError={() => setPhotoPreview("")}
                          />
                          <button
                            type="button"
                            onClick={clearPhoto}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-white transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Notice</p>
                    Provide a clear, front-facing photo. The system will automatically generate face embeddings upon registration for future matching.
                  </div>

                  <div className="pt-2 border-t border-border/50">
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
