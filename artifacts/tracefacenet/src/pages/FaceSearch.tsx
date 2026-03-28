import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from "@/components/ui";
import { usePerformSearchMutation } from "@/hooks/use-api-mutations";
import { useListSearches } from "@workspace/api-client-react";
import { useState, useRef, useCallback } from "react";
import { ScanFace, Upload, Search, Target, AlertTriangle, ChevronRight, History, MapPin, X, ImagePlus, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

type InputMode = "upload" | "url";

export default function FaceSearch() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchMutation = usePerformSearchMutation();
  const { data: historyRes } = useListSearches({ limit: 10 });
  const history = historyRes?.data || [];
  const [lastResult, setLastResult] = useState<any>(null);

  const loadFileAsDataUrl = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewSrc(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFileAsDataUrl(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFileAsDataUrl(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setImageUrl(val);
    setPreviewSrc(val);
  };

  const handleClear = () => {
    setImageUrl("");
    setPreviewSrc("");
    setLastResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        onError: () => setIsSearching(false),
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
          {/* Input Panel */}
          <Card className="lg:sticky lg:top-24 h-fit border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
              <CardTitle className="text-lg flex items-center text-primary">
                <Target className="w-5 h-5 mr-2" />
                Input Query Image
              </CardTitle>
              {/* Mode Toggle */}
              <div className="flex rounded-lg border border-border/50 overflow-hidden mt-3 bg-background/50 p-1 gap-1">
                <button
                  onClick={() => { setInputMode("upload"); handleClear(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === "upload" ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Upload className="w-4 h-4" /> Upload File
                </button>
                <button
                  onClick={() => { setInputMode("url"); handleClear(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === "url" ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LinkIcon className="w-4 h-4" /> Image URL
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Upload mode */}
              <AnimatePresence mode="wait">
                {inputMode === "upload" ? (
                  <motion.div key="upload" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {!previewSrc ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`aspect-square relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${isDragging ? "border-primary bg-primary/10 scale-[0.99]" : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5"}`}
                      >
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary opacity-40 m-2 transition-opacity group-hover:opacity-80" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary opacity-40 m-2 transition-opacity group-hover:opacity-80" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary opacity-40 m-2 transition-opacity group-hover:opacity-80" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary opacity-40 m-2 transition-opacity group-hover:opacity-80" />
                        <ImagePlus className={`w-12 h-12 mb-3 transition-all ${isDragging ? "text-primary scale-110" : "text-muted-foreground/40 group-hover:text-primary/60"}`} />
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          {isDragging ? "Drop image here" : "Click to upload or drag & drop"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP supported</p>
                      </div>
                    ) : (
                      <div className="aspect-square relative rounded-lg border border-border/50 overflow-hidden">
                        <img src={previewSrc} alt="Query" className="w-full h-full object-cover" />
                        <button
                          onClick={handleClear}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {isSearching && (
                          <>
                            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                              <div className="text-primary font-mono text-base font-bold tracking-widest flex flex-col items-center">
                                <ScanFace className="w-12 h-12 mb-2 animate-pulse" />
                                ANALYZING BIOMETRICS...
                              </div>
                            </div>
                          </>
                        )}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary opacity-60 m-2" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary opacity-60 m-2" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary opacity-60 m-2" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary opacity-60 m-2" />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="url" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="https://example.com/face.jpg"
                          value={imageUrl}
                          onChange={handleUrlChange}
                          className="pl-10"
                        />
                        <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      </div>
                      {imageUrl && (
                        <button onClick={handleClear} className="w-10 h-10 rounded-md border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/50 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="aspect-square relative rounded-lg border-2 border-dashed border-border/50 bg-secondary/30 overflow-hidden">
                      {previewSrc ? (
                        <>
                          <img
                            src={previewSrc}
                            alt="Query"
                            className="w-full h-full object-cover"
                            onError={() => setPreviewSrc("")}
                          />
                          {isSearching && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                              <div className="text-primary font-mono text-base font-bold tracking-widest flex flex-col items-center">
                                <ScanFace className="w-12 h-12 mb-2 animate-pulse" />
                                ANALYZING BIOMETRICS...
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <ScanFace className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm">Paste a direct image URL above</p>
                        </div>
                      )}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary opacity-50 m-2 pointer-events-none" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary opacity-50 m-2 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary opacity-50 m-2 pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary opacity-50 m-2 pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleSearch}
                disabled={!imageUrl || isSearching}
                className="w-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                size="lg"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Scanning Database..." : "Execute Biometric Search"}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-6">
            {lastResult ? (
              <Card className="border-success/20 overflow-hidden">
                <CardHeader className="bg-success/5 border-b border-success/10 py-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center text-success">
                      <Search className="w-4 h-4 mr-2" />
                      Scan Results — {lastResult.totalMatches} match{lastResult.totalMatches !== 1 ? "es" : ""} found
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{lastResult.searchDurationMs}ms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {lastResult.matches.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50 text-warning" />
                      <p>No matches found in the database.</p>
                      <p className="text-xs mt-1">Try lowering the confidence threshold or check if records exist.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {lastResult.matches.map((match: any, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                          <Link href={`/missing-persons/${match.missingPersonId}`} className="block hover:bg-secondary/40 transition-colors p-4 group">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 rounded bg-secondary border border-border shrink-0 overflow-hidden relative">
                                {match.photoUrl && <img src={match.photoUrl} alt="" className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 border-2 border-success/50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{match.missingPersonName}</h4>
                                  <Badge variant={match.confidence === "high" ? "destructive" : match.confidence === "medium" ? "warning" : "secondary"} className="font-mono">
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
              <div className="h-40 glass-panel rounded-xl flex items-center justify-center text-muted-foreground border-dashed text-sm">
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
                        <div className="w-10 h-10 rounded bg-secondary shrink-0 overflow-hidden border border-border/50 flex items-center justify-center">
                          {item.queryImageUrl.startsWith("data:") ? (
                            <img src={item.queryImageUrl} className="w-full h-full object-cover" alt="query" />
                          ) : (
                            <img src={item.queryImageUrl} className="w-full h-full object-cover" alt="query" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.totalMatches} match{item.totalMatches !== 1 ? "es" : ""} found
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">{item.searchDurationMs}ms</div>
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
