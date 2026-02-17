"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react"
import { getCachedUITranslations, setCachedUITranslations, invalidateUITranslationCache } from "@/lib/cache"
import { hasComponentsChanged, updateComponentHash, hasTranslationVersionChanged, updateTranslationVersion, generateComponentHash } from "@/lib/component-tracker"
import { TRANSLATION_CONFIG, debugLog, logPerformance } from "@/config/translation-config"

interface LingoContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, params?: Record<string, string>) => string
  isLoading: boolean
  clearCache: () => void
  cacheHit: boolean
}

const LingoContext = createContext<LingoContextType | undefined>(undefined)

const translationCache: Map<string, string> = new Map()

async function translateText(text: string, targetLocale: string, sourceLocale: string = "en"): Promise<string> {
  if (targetLocale === sourceLocale) {
    return text
  }

  const cacheKey = `${sourceLocale}-${targetLocale}-${text}`

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLocale,
        sourceLocale,
      }),
    })

    if (!response.ok) {
      throw new Error("Translation request failed")
    }

    const data = await response.json()
    const translated = data.translated || text

    if (translated && translated !== text) {
      translationCache.set(cacheKey, translated)
      return translated
    }

    return text
  } catch (error) {
    console.warn("Translation error:", error)
    return text
  }
}

async function translateBatch(texts: string[], targetLocale: string, sourceLocale: string = "en"): Promise<string[]> {
  if (targetLocale === sourceLocale) {
    return texts
  }

  // Check cache first and only request uncached items
  const uncachedTexts: string[] = []
  const uncachedIndices: number[] = []
  const results: string[] = [...texts]

  texts.forEach((text, index) => {
    const cacheKey = `${sourceLocale}-${targetLocale}-${text}`
    if (translationCache.has(cacheKey)) {
      results[index] = translationCache.get(cacheKey)!
    } else {
      uncachedTexts.push(text)
      uncachedIndices.push(index)
    }
  })

  if (uncachedTexts.length === 0) {
    return results
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: uncachedTexts,
        targetLocale,
        sourceLocale,
      }),
    })

    if (!response.ok) {
      throw new Error("Batch translation request failed")
    }

    const data = await response.json()
    const translatedTexts = data.translated || uncachedTexts

    // Update results and cache
    uncachedIndices.forEach((originalIndex, batchIndex) => {
      const translated = translatedTexts[batchIndex] || uncachedTexts[batchIndex]
      results[originalIndex] = translated

      if (translated && translated !== uncachedTexts[batchIndex]) {
        const cacheKey = `${sourceLocale}-${targetLocale}-${uncachedTexts[batchIndex]}`
        translationCache.set(cacheKey, translated)
      }
    })

    return results
  } catch (error) {
    console.warn("Batch translation error:", error)
    return texts
  }
}

// ─── Shared languages list (used by all language pickers across the app) ───
export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Čeština", flag: "��" },
]

const UI_KEYS = [
  // Landing page
  "Lango",
  "World",
  "A multilingual tool for",
  "professionals",
  "and",
  "everyday",
  "communication.",
  "GET STARTED",
  // Workspace / Flow
  "History",
  "summary",
  "summaries",
  "No summaries yet",
  "Untitled Video",
  "Download",
  "Set custom URL",
  "Custom URL",
  "Synced to cloud",
  "Summary",
  "Published",
  "Video Summary",
  "Open Summary Page",
  "Page URL",
  "Save Custom URL",
  "Saving...",
  "Open",
  "Edit",
  "Rename failed",
  "Network error",
  "URL taken or error",
  "✓ Custom URL saved!",
  "Workspace",
  "Sign out",
  // Summary pages
  "Document Analysis",
  "Key Points",
  "Detailed Explanation",
  "Extracted Text",
  "Translate",
  "Translate page",
  "Collapse",
  "Expand",
  "View Original",
  "Viewing Original",
  "Download as Markdown",
  "Read summary aloud",
  "Stop reading",
  // Toasts
  "Fetching transcript & analyzing with Gemini...",
  "AI analysis failed",
  "Failed to save to cloud",
  "Uploading video to CDN...",
  "AI is analyzing your video...",
  "Upload failed",
  "Video analysis failed",
  "Failed to save summary",
  "Uploading document...",
  "AI is analyzing your document...",
  "Document analysis failed",
  "Something went wrong",
  "Watch on YouTube ↗",
]

export function LingoProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState("en")
  const [isLoading, setIsLoading] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const [cacheHit, setCacheHit] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLocale = localStorage.getItem("lingo-locale")
    if (savedLocale) {
      setLocale(savedLocale)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("lingo-locale", locale)
      document.documentElement.lang = locale
    }
  }, [locale, mounted])

  useEffect(() => {
    if (!mounted || locale === "en") {
      setTranslations({})
      setIsLoading(false)
      setCacheHit(false)
      return
    }

    setIsLoading(true)
    setCacheHit(false)

    // Use setTimeout to ensure this runs after client mount, preventing SSR mismatch
    const timer = setTimeout(() => {
      const translateAll = async () => {
        const startTime = performance.now()

        try {
          // Check for component changes and version changes
          const componentsChanged = hasComponentsChanged(UI_KEYS)
          const versionChanged = hasTranslationVersionChanged()

          debugLog('Translation checks', {
            locale,
            componentsChanged,
            versionChanged
          })

          // Try to load from cache first
          const cachedTranslations = getCachedUITranslations(locale)

          if (cachedTranslations && !componentsChanged && !versionChanged) {
            debugLog('Loading translations from cache', {
              locale,
              keyCount: cachedTranslations.keyCount
            })

            setTranslations(cachedTranslations.translations)
            setCacheHit(true)
            setIsLoading(false)

            logPerformance('Cache hit', performance.now() - startTime)
            return
          }

          // Cache miss or invalid - need API call
          debugLog('Cache miss or invalid, fetching from API', {
            locale,
            cachedTranslations: !!cachedTranslations,
            componentsChanged,
            versionChanged
          })

          const translatedTexts = await translateBatch(UI_KEYS, locale, "en")
          const translated: Record<string, string> = {}

          UI_KEYS.forEach((key, index) => {
            translated[key] = translatedTexts[index] || key
          })

          // Save to cache with component hashes
          const componentHashes = {
            ui_keys: generateComponentHash(UI_KEYS),
            version: TRANSLATION_CONFIG.TRANSLATION_VERSION
          }

          setCachedUITranslations(locale, translated, componentHashes, TRANSLATION_CONFIG.TRANSLATION_VERSION)
          updateComponentHash(UI_KEYS)
          updateTranslationVersion()

          setTranslations(translated)
          setCacheHit(false)

          logPerformance('API translation', performance.now() - startTime)

        } catch (error) {
          console.warn("Translation failed, attempting fallback:", error)

          // Try to use stale cache if available
          const staleCache = getCachedUITranslations(locale)
          if (staleCache && TRANSLATION_CONFIG.FALLBACK_TO_API) {
            debugLog('Using stale cache as fallback', { locale })
            setTranslations(staleCache.translations)
            setCacheHit(true) // Mark as hit since we're using cache
          } else {
            // Final fallback to individual translations
            const translated: Record<string, string> = {}

            for (const key of UI_KEYS) {
              try {
                const translatedText = await translateText(key, locale, "en")
                translated[key] = translatedText
              } catch (error) {
                translated[key] = key
              }
            }

            setTranslations(translated)
            setCacheHit(false)
          }
        }

        setIsLoading(false)
      }

      translateAll()
    }, 0) // Minimal timeout to ensure client-side execution

    return () => clearTimeout(timer)
  }, [locale, mounted])

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let result = key

    // Only use translations on client-side after mounting and when locale is not English
    if (mounted && locale !== "en" && translations[key]) {
      result = translations[key]
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        result = result.replace(`{{${paramKey}}}`, value)
        result = result.replace(`{${paramKey}}}`, value)
      })
    }

    return result
  }, [locale, translations, mounted])

  const clearCache = useCallback(() => {
    invalidateUITranslationCache(locale)
    setTranslations({})
    setCacheHit(false)
    debugLog('Cache cleared manually', { locale })
  }, [locale])

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    isLoading,
    clearCache,
    cacheHit,
  }), [locale, t, isLoading, mounted, clearCache, cacheHit])

  return (
    <LingoContext.Provider value={value}>
      <div className={isLoading ? "pointer-events-none select-none" : ""}>
        {children}
      </div>
    </LingoContext.Provider>
  )
}

export function useLingo() {
  const context = useContext(LingoContext)
  if (context === undefined) {
    throw new Error("useLingo must be used within a LingoProvider")
  }
  return context
}
