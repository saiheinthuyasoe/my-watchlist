"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const AIRING_STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "RELEASING", label: "Currently airing" },
  { value: "FINISHED", label: "Finished airing" },
  { value: "NOT_YET_RELEASED", label: "Not yet released" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "HIATUS", label: "On hiatus" },
];

const SEASON_OPTIONS = [
  { value: "", label: "Any season" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "Any source" },
  { value: "ORIGINAL", label: "Original" },
  { value: "MANGA", label: "Manga" },
  { value: "LIGHT_NOVEL", label: "Light novel" },
  { value: "VISUAL_NOVEL", label: "Visual novel" },
  { value: "VIDEO_GAME", label: "Video game" },
  { value: "OTHER", label: "Other" },
  { value: "NOVEL", label: "Novel" },
  { value: "DOUJINSHI", label: "Doujinshi" },
  { value: "ANIME", label: "Anime" },
];

const STREAMING_OPTIONS = [
  { value: "", label: "Any platform" },
  { value: "crunchyroll", label: "Crunchyroll" },
  { value: "netflix", label: "Netflix" },
  { value: "hidive", label: "HIDIVE" },
  { value: "funimation", label: "Funimation" },
  { value: "hulu", label: "Hulu" },
  { value: "disney", label: "Disney+" },
  { value: "amazon", label: "Amazon Prime" },
];

const COUNTRY_OPTIONS = [
  { value: "", label: "Any country" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "KR", label: "South Korea" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "", label: "Any year" },
  ...Array.from({ length: 50 }, (_, i) => currentYear - i).map((year) => ({
    value: String(year),
    label: String(year),
  })),
];

export interface AdvancedFilterValues {
  airingStatus: string;
  streaming: string;
  countryOfOrigin: string;
  source: string;
  yearMin: string;
  yearMax: string;
  episodesMin: string;
  episodesMax: string;
  durationMin: string;
  durationMax: string;
  year: string;
  season: string;
}

interface AdvancedFiltersProps {
  values: AdvancedFilterValues;
  onChange: (values: Partial<AdvancedFilterValues>) => void;
  onClear: () => void;
  hideCountryFilter?: boolean;
}

export function AdvancedFilters({
  values,
  onChange,
  onClear,
  hideCountryFilter,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.entries(values).filter(
    ([key, value]) => {
      // Skip country filter if hidden
      if (hideCountryFilter && key === "countryOfOrigin") return false;
      // Only count advanced filters (not year/season which are now in main bar)
      const advancedOnlyFields = ['airingStatus', 'streaming', 'source', 'episodesMin', 'episodesMax', 'durationMin', 'durationMax', 'yearMin', 'yearMax'];
      if (advancedOnlyFields.includes(key)) return Boolean(value);
      return false;
    }
  ).length;

  const handleChange = (field: keyof AdvancedFilterValues, value: string) => {
    onChange({ [field]: value });
  };

  const handleClearAndClose = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <>
      {/* Compact Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-all",
          activeFilterCount > 0
            ? "border-accent bg-accent text-white shadow-sm hover:bg-accent-hover"
            : "border-line bg-white text-fg hover:border-accent/50 hover:bg-accent/5 dark:bg-elevated"
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 && (
          <Badge variant="default" className="ml-0.5 h-5 min-w-5 bg-white/20 px-1.5 text-xs text-white">
            {activeFilterCount}
          </Badge>
        )}
      </button>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Advanced Filters"
        size="xl"
      >
        <div className="space-y-5">
          {/* Status & Source */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-fg">
                Airing Status
              </label>
              <Select
                options={AIRING_STATUS_OPTIONS}
                value={values.airingStatus}
                onChange={(e) => handleChange("airingStatus", e.target.value)}
                aria-label="Filter by airing status"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-fg">
                Source Material
              </label>
              <Select
                options={SOURCE_OPTIONS}
                value={values.source}
                onChange={(e) => handleChange("source", e.target.value)}
                aria-label="Filter by source material"
              />
            </div>
          </div>

          {/* Streaming & Country */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-fg">
                Streaming Platform
              </label>
              <Select
                options={STREAMING_OPTIONS}
                value={values.streaming}
                onChange={(e) => handleChange("streaming", e.target.value)}
                aria-label="Filter by streaming platform"
              />
            </div>

            {!hideCountryFilter && (
              <div>
                <label className="mb-2 block text-sm font-medium text-fg">
                  Country of Origin
                </label>
                <Select
                  options={COUNTRY_OPTIONS}
                  value={values.countryOfOrigin}
                  onChange={(e) => handleChange("countryOfOrigin", e.target.value)}
                  aria-label="Filter by country"
                />
              </div>
            )}
          </div>

          {/* Episodes & Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-fg">
                Episodes
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={values.episodesMin}
                  onChange={(e) => handleChange("episodesMin", e.target.value)}
                  min="1"
                  aria-label="Minimum episodes"
                />
                <span className="text-sm text-muted">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={values.episodesMax}
                  onChange={(e) => handleChange("episodesMax", e.target.value)}
                  min="1"
                  aria-label="Maximum episodes"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-fg">
                Duration (minutes)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={values.durationMin}
                  onChange={(e) => handleChange("durationMin", e.target.value)}
                  min="1"
                  aria-label="Minimum duration"
                />
                <span className="text-sm text-muted">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={values.durationMax}
                  onChange={(e) => handleChange("durationMax", e.target.value)}
                  min="1"
                  aria-label="Maximum duration"
                />
              </div>
            </div>
          </div>

          {/* Year Range (optional additional filter) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-fg">
              Year Range (optional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="From (e.g., 2020)"
                value={values.yearMin}
                onChange={(e) => handleChange("yearMin", e.target.value)}
                min="1940"
                max={String(currentYear)}
                aria-label="Minimum year"
              />
              <span className="text-sm text-muted">—</span>
              <Input
                type="number"
                placeholder="To (e.g., 2024)"
                value={values.yearMax}
                onChange={(e) => handleChange("yearMax", e.target.value)}
                min="1940"
                max={String(currentYear)}
                aria-label="Maximum year"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Use this if you need a range instead of a specific year
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <Button
              variant="ghost"
              onClick={handleClearAndClose}
              disabled={activeFilterCount === 0}
            >
              <X className="h-4 w-4" /> Clear all filters
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
