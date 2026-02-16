"use client"

import { useLingo, LANGUAGES } from "@/lib/lingo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"

export function LanguageSwitcher() {
  const { locale, setLocale, isLoading } = useLingo()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 min-w-8 px-2"
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className="cursor-pointer px-2 py-1.5"
            disabled={isLoading}
          >
            <span className="flex-1 text-sm">{language.name}</span>
            {locale === language.code && (
              <Check className="h-3.5 w-3.5 text-primary ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
