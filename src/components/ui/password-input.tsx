import {Input} from "@/components/ui/input.tsx";
import {Eye, EyeOff} from "lucide-react";
import {
    ComponentProps,
    forwardRef,
    useId,
    useState
} from "react";

const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>((props, ref) => {
    const id = useId();
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const toggleVisibility = () => setIsVisible((prevState) => !prevState);

    return (
        <div className="relative">
            <Input
                id={id}
                className="pe-9"
                placeholder="Password"
                ref={ref}
                {...props}
                type={isVisible ? "text" : "password"}
            />
            <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={toggleVisibility}
                aria-label={isVisible ? "Hide password" : "Show password"}
                aria-pressed={isVisible}
                aria-controls="password"
            >
                {isVisible ? (
                    <EyeOff size={16} strokeWidth={2} aria-hidden="true"/>
                ) : (
                    <Eye size={16} strokeWidth={2} aria-hidden="true"/>
                )}
            </button>
        </div>
    );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;