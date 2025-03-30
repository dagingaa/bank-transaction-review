import { ThemeSwitcher } from "./theme-switcher";
import { Github } from "lucide-react";
import Link from "next/link";

export default function AuthButton() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="https://github.com/dagingaa/bank-transaction-review"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Github size={18} />
        <span className="hidden sm:inline-block">GitHub</span>
      </Link>
      <ThemeSwitcher />
    </div>
  );
}
