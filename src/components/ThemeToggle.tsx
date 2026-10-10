'use client';
import { useEffect, useState } from 'react';
type Preference = 'light' | 'dark' | 'system';
export default function ThemeToggle() {
  const [preference, setPreference] = useState<Preference>('system');
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    function apply() {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('ghostroute.theme');
      } catch {}
      const value = saved === 'light' || saved === 'dark' ? saved : 'system';
      setPreference(value);
      document.documentElement.dataset.theme =
        value === 'system' ? (media.matches ? 'dark' : 'light') : value;
    }
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', apply);
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener('storage', apply);
    };
  }, []);
  return (
    <label className="theme-control">
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        value={preference}
        onChange={(event) => {
          const value = event.target.value as Preference;
          setPreference(value);
          try {
            localStorage.setItem('ghostroute.theme', value);
          } catch {}
          document.documentElement.dataset.theme =
            value === 'system'
              ? matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
              : value;
        }}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
