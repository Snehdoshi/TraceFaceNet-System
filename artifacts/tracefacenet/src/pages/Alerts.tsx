import { Layout } from "@/components/Layout";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { useListAlerts } from "@workspace/api-client-react";
import { useUpdateAlertMutation } from "@/hooks/use-api-mutations";
import { Filter, BellRing, Target, AlertTriangle, ShieldCheck, FilePlus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";

type AlertFilter = "all" | "pending" | "acknowledged" | "resolved";

export default function Alerts() {
  const [filter, setFilter] = useState<AlertFilter>("pending");
  
  const { data: response, isLoading } = useListAlerts(
    filter === "all" ? {} : { status: filter as any }
  );
  
  const updateMutation = useUpdateAlertMutation();

  const alerts = response?.data || [];

  const handleUpdateStatus = (id: number, newStatus: "acknowledged" | "resolved") => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'match_found': return { icon: Target, color: 'text-destructive', border: 'border-l-destructive', bg: 'bg-destructive/10' };
      case 'new_case': return { icon: FilePlus, color: 'text-primary', border: 'border-l-primary', bg: 'bg-primary/10' };
      case 'case_updated': return { icon: AlertTriangle, color: 'text-warning', border: 'border-l-warning', bg: 'bg-warning/10' };
      case 'case_closed': return { icon: ShieldCheck, color: 'text-success', border: 'border-l-success', bg: 'bg-success/10' };
      default: return { icon: BellRing, color: 'text-muted-foreground', border: 'border-l-border', bg: 'bg-secondary' };
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">System Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage priority notifications from the recognition engine.</p>
        </div>

        <div className="glass-panel p-2 rounded-xl flex flex-wrap items-center gap-2">
          <div className="flex items-center px-3 text-sm text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" />
            View:
          </div>
          {(["all", "pending", "acknowledged", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === s 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="animate-pulse h-24 bg-secondary/20" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-xl border-dashed">
            <BellRing className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No alerts found</h3>
            <p className="text-muted-foreground mt-1">There are no {filter !== "all" ? filter : ""} alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const style = getAlertStyle(alert.type);
              const Icon = style.icon;
              return (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-l-4 ${style.border} overflow-hidden`}>
                    <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                      <div className={`p-3 rounded-full shrink-0 ${style.bg}`}>
                        <Icon className={`w-6 h-6 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant={alert.status === 'pending' ? 'destructive' : alert.status === 'acknowledged' ? 'warning' : 'outline'}>
                            {alert.status}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">{formatDate(alert.createdAt)}</span>
                        </div>
                        <h3 className="text-base font-medium text-foreground">{alert.message}</h3>
                        
                        {/* Meta info if available */}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {alert.similarity !== null && alert.similarity !== undefined && (
                            <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
                              Confidence: <span className="text-primary font-bold">{(alert.similarity * 100).toFixed(1)}%</span>
                            </span>
                          )}
                          {alert.location && (
                            <span className="flex items-center">
                              Target Location: {alert.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                        {alert.missingPersonId && (
                          <Link href={`/missing-persons/${alert.missingPersonId}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View Case
                            </Button>
                          </Link>
                        )}
                        {alert.status === 'pending' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(alert.id, "acknowledged")}
                            className="w-full text-warning hover:text-warning hover:bg-warning/10"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(alert.id, "resolved")}
                            className="w-full bg-success hover:bg-success/90 text-success-foreground"
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
