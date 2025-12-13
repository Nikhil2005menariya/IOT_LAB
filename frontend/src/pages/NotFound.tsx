import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cpu, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center animate-fade-in">
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
          <div className="relative p-6 bg-card border border-border rounded-full">
            <Cpu className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The component you're looking for doesn't exist in our inventory.
        </p>
        
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
