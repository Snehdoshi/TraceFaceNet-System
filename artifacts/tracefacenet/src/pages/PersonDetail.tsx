import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { useGetMissingPerson } from "@workspace/api-client-react";
import { useUpdatePersonMutation, useDeletePersonMutation } from "@/hooks/use-api-mutations";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Calendar, Phone, Activity, Fingerprint, Edit, Trash2, X, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PersonDetail() {
  const [, params] = useRoute("/missing-persons/:id");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: person, isLoading } = useGetMissingPerson(id, { query: { enabled: id > 0 } });
  const updateMutation = useUpdatePersonMutation();
  const deleteMutation = useDeletePersonMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  if (isLoading) return <Layout><div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div></Layout>;
  
  if (!person) return <Layout><div className="p-8 text-center text-destructive">Record not found.</div></Layout>;

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({
        status: person.status,
        description: person.description || "",
        lastSeenLocation: person.lastSeenLocation,
        contactName: person.contactName,
        contactPhone: person.contactPhone,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { id, data: editData },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Record updated successfully" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this record? This action cannot be undone.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Record deleted" });
          setLocation("/missing-persons");
        }
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary border border-border/80 rounded-lg shadow-inner">
              <Fingerprint className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.name}</h1>
                <Badge variant={person.status === 'active' ? 'warning' : person.status === 'found' ? 'success' : 'secondary'} className="uppercase">
                  {person.status}
                </Badge>
              </div>
              <p className="text-primary font-mono text-sm tracking-widest">{person.caseNumber}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleEditToggle} disabled={updateMutation.isPending}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSave} isLoading={updateMutation.isPending} className="bg-success text-success-foreground hover:bg-success/90">
                  <Check className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEditToggle}>
                  <Edit className="w-4 h-4 mr-2" /> Update Record
                </Button>
                <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
                  <Trash2 className="w-4 h-4 mr-2" /> Purge
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="aspect-[3/4] relative bg-secondary">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                    <User className="w-16 h-16 mb-4 opacity-50" />
                    <p>No primary visual reference available.</p>
                  </div>
                )}
                {/* Tech overlay effect */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
                <div className="absolute inset-0 pointer-events-none border-[4px] border-primary/20 m-2 mix-blend-overlay" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/50 animate-scan pointer-events-none shadow-[0_0_15px_rgba(59,130,246,1)]" />
              </div>
            </Card>

            {isEditing && (
              <Card className="border-warning/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <CardHeader className="py-4 border-b border-border/50">
                  <CardTitle className="text-sm">Status Management</CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <Label className="mb-2 block">Case Status</Label>
                  <select 
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="w-full h-10 rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm neon-border text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="found">Found</option>
                    <option value="closed">Closed</option>
                  </select>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-border/50 bg-secondary/10">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Subject Intel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-y divide-border/50 border-b border-border/50">
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Age</p>
                    <p className="text-lg font-medium">{person.age} years</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Gender</p>
                    <p className="text-lg font-medium capitalize">{person.gender}</p>
                  </div>
                  <div className="p-4 col-span-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Description</p>
                    {isEditing ? (
                      <Textarea 
                        value={editData.description} 
                        onChange={(e) => setEditData({...editData, description: e.target.value})} 
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{person.description || "No description provided."}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="border-b border-border/50 py-4">
                  <CardTitle className="text-base flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    Last Known Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Location</p>
                    {isEditing ? (
                      <Input 
                        value={editData.lastSeenLocation} 
                        onChange={(e) => setEditData({...editData, lastSeenLocation: e.target.value})} 
                      />
                    ) : (
                      <p className="text-sm font-medium">{person.lastSeenLocation}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Time/Date
                    </p>
                    <p className="text-sm font-medium">{formatDate(person.lastSeenDate)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/50 py-4">
                  <CardTitle className="text-base flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    Point of Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Name</p>
                    {isEditing ? (
                      <Input 
                        value={editData.contactName} 
                        onChange={(e) => setEditData({...editData, contactName: e.target.value})} 
                      />
                    ) : (
                      <p className="text-sm font-medium">{person.contactName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Phone</p>
                    {isEditing ? (
                      <Input 
                        value={editData.contactPhone} 
                        onChange={(e) => setEditData({...editData, contactPhone: e.target.value})} 
                      />
                    ) : (
                      <p className="text-sm font-mono tracking-wide">{person.contactPhone}</p>
                    )}
                  </div>
                  {person.contactEmail && !isEditing && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Email</p>
                      <p className="text-sm">{person.contactEmail}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="text-xs text-muted-foreground text-right border-t border-border/50 pt-4">
              Registered: {formatDate(person.createdAt)} • Last Updated: {formatDate(person.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
