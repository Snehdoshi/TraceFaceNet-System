import { Layout } from "@/components/Layout";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { useListMissingPersons } from "@workspace/api-client-react";
import { Filter, UserPlus, MapPin, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

type StatusFilter = "all" | "active" | "found" | "closed";

export default function MissingPersons() {
  const [status, setStatus] = useState<StatusFilter>("all");
  
  const { data: response, isLoading } = useListMissingPersons(
    status === "all" ? {} : { status: status as any }
  );

  const persons = response?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Registry Database</h1>
            <p className="text-muted-foreground">Comprehensive records of all missing persons cases.</p>
          </div>
          <Link href="/missing-persons/new">
            <Button className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Log New Case
            </Button>
          </Link>
        </div>

        <div className="glass-panel p-2 rounded-xl flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center px-3 text-sm text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" />
            Filter Status:
          </div>
          {(["all", "active", "found", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === s 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <Card key={i} className="animate-pulse h-[340px] bg-secondary/20" />
            ))}
          </div>
        ) : persons.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-xl">
            <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No records found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or add a new case.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {persons.map((person, index) => (
              <motion.div 
                key={person.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/missing-persons/${person.id}`}>
                  <Card className="h-full cursor-pointer hover:-translate-y-1 hover:shadow-primary/20 transition-all duration-300 group">
                    <div className="aspect-[4/3] relative overflow-hidden bg-secondary border-b border-border/50">
                      {person.photoUrl ? (
                        <img 
                          src={person.photoUrl} 
                          alt={person.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Photo
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant={
                          person.status === 'active' ? 'warning' : 
                          person.status === 'found' ? 'success' : 'secondary'
                        } className="shadow-lg backdrop-blur-md bg-opacity-90">
                          {person.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
                      <div className="absolute bottom-3 left-3 text-xs font-mono font-bold text-primary px-2 py-1 bg-background/80 backdrop-blur-sm rounded border border-primary/20">
                        {person.caseNumber}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <div className="text-sm text-muted-foreground flex items-center space-x-3 mb-3">
                        <span>{person.age} yrs</span>
                        <span>•</span>
                        <span className="capitalize">{person.gender}</span>
                      </div>
                      <div className="flex items-start text-xs text-muted-foreground bg-secondary/30 p-2 rounded border border-border/50">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0 text-primary/70" />
                        <span className="line-clamp-2">{person.lastSeenLocation}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
