import { ThemeSwitcher } from "./theme-switcher";

export default function AuthButton() {
  return (
    <div className="flex items-center gap-4">
      <ThemeSwitcher />
    </div>
  );
}
