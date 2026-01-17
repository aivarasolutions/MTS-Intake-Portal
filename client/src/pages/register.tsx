import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { registerSchema, type RegisterInput } from "@shared/schema";
import { register as registerUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success && result.user) {
        toast({
          title: "Account created!",
          description: "Welcome to MTS 1040. You are now signed in.",
        });
        setUser(result.user);
        // Small delay to allow React state to propagate before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        setLocation(result.redirectTo || "/dashboard/client");
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: result.error || "Could not create your account.",
        });
        setIsLoading(false);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">MTS 1040</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started with MTS 1040 to securely manage your tax documents
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      data-testid="input-first-name"
                      {...register("first_name")}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      data-testid="input-last-name"
                      {...register("last_name")}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    data-testid="input-email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      data-testid="input-password"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      data-testid="input-confirm-password"
                      {...register("confirmPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit-register"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                    data-testid="link-login"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t bg-background">
        <p>&copy; {new Date().getFullYear()} MTS 1040 Tax Services. All rights reserved.</p>
      </footer>
    </div>
  );
}
