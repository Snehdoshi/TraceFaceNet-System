import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from "@/components/ui";
import { usePerformSearchMutation } from "@/hooks/use-api-mutations";
import { useListSearches } from "@workspace/api-client-react";
import { useState } from "react";
import { ScanFace, Upload, Search, Target, AlertTriangle, ChevronRight, History, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

export default function FaceSearch() {
  const [imageUrl, setImageUrl] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchMutation = usePerformSearchMutation();
  const { data: historyRes } = useListSearches({ limit: 10 });
  const history = historyRes?.data || [];

  const [lastResult, setLastResult] = useState<any>(null);

  const handleSearch = () => {
    if (!imageUrl) return;
    setIsSearching(true);
    
    searchMutation.mutate(
      { queryImageUrl: imageUrl, confidence: 0.6 },
      {
        onSuccess: (res) => {
          setLastResult(res);
          setIsSearching(false);
        },
        onError: () => {
          setIsSearching(false);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Biometric Face Search</h1>
          <p className="text-muted-foreground">Run facial recognition against the TraceFaceNet missing persons database.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:sticky lg:top-24 h-fit border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center text-primary">
                <Target className="w-5 h-5 mr-2" />
                Input Query Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input 
                      placeholder="Paste image URL here..." 
                      value={imageUrl} 
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="pl-10"
                    />
                    <Upload className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  <Button onClick={handleSearch} disabled={!imageUrl || isSearching} className="w-28 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                    {isSearching ? "Scanning..." : "Execute"}
                  </Button>
                </div>
              </div>

              <div className="aspect-square relative rounded-lg border-2 border-dashed border-border/50 bg-secondary/30 flex items-center justify-center overflow-hidden group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Query" className="w-full h-full object-cover" />
                    {isSearching && (
                      <>
                        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                          <div className="text-primary font-mono text-lg font-bold tracking-widest flex flex-col items-center">
                            <ScanFace className="w-12 h-12 mb-2 animate-pulse" />
                            ANALYZING BIOMETRICS...
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground flex flex-col items-center p-6">
                    <ScanFace className="w-12 h-12 mb-4 opacity-30 group-hover:opacity-60 transition-opacity group-hover:text-primary" />
                    <p className="text-sm">Provide a clear image URL to begin recognition scan.</p>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary opacity-50 m-2" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary opacity-50 m-2" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary opacity-50 m-2" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary opacity-50 m-2" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {lastResult ? (
              <Card className="border-success/20 overflow-hidden">
                <CardHeader className="bg-success/5 border-b border-success/10 py-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center text-success">
                      <Search className="w-4 h-4 mr-2" />
                      Scan Results
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      Time: {lastResult.searchDurationMs}ms
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {lastResult.matches.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50 text-warning" />
                      <p>No matches found in the database.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {lastResult.matches.map((match: any, i: number) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1 }}
                        >
                          <Link href={`/missing-persons/${match.missingPersonId}`} className="block hover:bg-secondary/40 transition-colors p-4 group">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 rounded bg-secondary border border-border shrink-0 overflow-hidden relative">
                                {match.photoUrl && <img src={match.photoUrl} alt="" className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 border-2 border-success/50 mix-blend-overlay" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{match.missingPersonName}</h4>
                                  <Badge variant={match.confidence === 'high' ? 'destructive' : match.confidence === 'medium' ? 'warning' : 'secondary'} className="font-mono shadow-sm">
                                    {(match.similarity * 100).toFixed(1)}% Match
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono mb-1">{match.caseNumber}</div>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="truncate">{match.lastSeenLocation}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="h-40 glass-panel rounded-xl flex items-center justify-center text-muted-foreground border-dashed">
                Awaiting query image execution.
              </div>
            )}

            <Card>
              <CardHeader className="py-4 border-b border-border/50">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground uppercase tracking-wider">
                  <History className="w-4 h-4 mr-2" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {history.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No search history available.</div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="p-4 flex items-center space-x-4">
                        <div className="w-10 h-10 rounded bg-secondary shrink-0 overflow-hidden border border-border/50">
                          <img src={item.queryImageUrl} className="w-full h-full object-cover" alt="query" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.totalMatches} match{item.totalMatches !== 1 ? 'es' : ''} found
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground text-right">
                          {item.searchDurationMs}ms
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
