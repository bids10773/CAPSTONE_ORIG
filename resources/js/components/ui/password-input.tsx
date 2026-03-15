import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <div className="relative group">
            <Input
                type={showPassword ? "text" : "password"}
                // 'pr-12' gives more breathing room for the icon
                className={cn("pr-12 bg-white/10 text-white placeholder:text-white/60 border-white/20", className)}
                {...props}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                // 'text-white/50' matches your other UI elements; hover:bg-transparent prevents the grey box
                className="absolute right-0 top-0 h-full w-12 px-3 hover:bg-transparent text-white/50 hover:text-white transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1} // Prevents tabbing into the eye icon instead of the next field
            >
                {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                ) : (
                    <EyeIcon className="h-5 w-5" />
                )}
            </Button>
        </div>
    );
}
