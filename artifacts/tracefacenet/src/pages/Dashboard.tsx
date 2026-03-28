import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { useGetStats, useListAlerts, useListMissingPersons } from "@workspace/api-client-react";
import { Activity, Search, ShieldCheck, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: alertsRes } = useListAlerts({ limit: 5 });
  const { data: personsRes } = useListMissingPersons({ limit: 5 });

  const alerts = alertsRes?.data || [];
  const persons = personsRes?.data || [];

  const statCards = [
    { title: "Total Cases Registered", value: stats?.totalCases || 0, icon: Users, color: "text-blue-500", glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]" },
    { title: "Active Investigations", value: stats?.activeCases || 0, icon: Activity, color: "text-warning", glow: "shadow-[0_0_30px_rgba(234,179,8,0.15)]" },
    { title: "Found / Closed", value: (stats?.foundCases || 0) + (stats?.closedCases || 0), icon: ShieldCheck, color: "text-success", glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]" },
    { title: "Total Face Searches", value: stats?.totalSearches || 0, icon: Search, color: "text-purple-500", glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
          <p className="text-muted-foreground">Overview of system operations and active investigations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`relative overflow-hidden ${stat.glow} border-t-2 border-t-white/5`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <stat.icon className={`w-16 h-16 ${stat.color}`} />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-display font-bold ${stat.color}`}>
                    {statsLoading ? "..." : stat.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                  Priority System Alerts
                </CardTitle>
                <Link href="/alerts" className="text-sm text-primary hover:text-primary/80 transition-colors">View All</Link>
              </CardHeader>
              <CardContent className="p-0">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No recent alerts.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {alerts.map(alert => (
                      <div key={alert.id} className="p-4 hover:bg-secondary/40 transition-colors flex items-start space-x-4">
                        <div className={`mt-1 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                          alert.type === 'match_found' ? 'bg-destructive text-destructive' :
                          alert.type === 'new_case' ? 'bg-primary text-primary' :
                          alert.type === 'case_closed' ? 'bg-success text-success' : 'bg-warning text-warning'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.createdAt)}</p>
                        </div>
                        <Badge variant={alert.status === 'pending' ? 'destructive' : 'outline'} className="text-[10px]">
                          {alert.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Recent Registrations
                </CardTitle>
                <Link href="/missing-persons" className="text-sm text-primary hover:text-primary/80 transition-colors">View Directory</Link>
              </CardHeader>
              <CardContent className="p-0">
                {persons.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No recent cases registered.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {persons.map(person => (
                      <Link key={person.id} href={`/missing-persons/${person.id}`} className="block">
                        <div className="p-4 hover:bg-secondary/40 transition-colors flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-md bg-secondary border border-border overflow-hidden shrink-0">
                            {person.photoUrl ? (
                              <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{person.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{person.caseNumber}</p>
                          </div>
                          <Badge variant={person.status === 'active' ? 'warning' : 'success'} className="shrink-0 uppercase text-[10px]">
                            {person.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
