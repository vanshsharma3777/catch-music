"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music4, ArrowRight, ArrowDown, Search, X } from "lucide-react";
import { SINGER_DATABASE, Singer } from "../app/lib/singersDB";
import SingerCard from "./SingerCard";

export default function SingerSelection() {
  const router = useRouter();
  const ITEMS_PER_PAGE = 12; // Increased to fill larger grid space nicely

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"followers" | "rating" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const categories = ["Hindi", "English", "Haryanvi", "Bhojpuri"];

  // Filter and sort singers
  const filteredSingers = SINGER_DATABASE.filter((singer) => {
    const matchesCategory = selectedCategory
      ? singer.categories.includes(selectedCategory)
      : true;

    const matchesSearch = searchQuery.trim() === ""
      ? true
      : singer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        singer.genre.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (!sortBy) {
      return a.ordinal - b.ordinal;
    }

    const aValue =
      sortBy === "followers"
        ? a.followers ?? 0
        : (a[sortBy as keyof Singer] as number);
    const bValue =
      sortBy === "followers"
        ? b.followers ?? 0
        : (b[sortBy as keyof Singer] as number);

    return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
  });

  const displayedSingers = filteredSingers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSingers.length;

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const loadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, filteredSingers.length)
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length !== 3) return;
    setIsSubmitting(true);

    const selectedSingers = SINGER_DATABASE.filter((s) =>
      selectedIds.includes(s.id)
    );
    console.log("singers selected" , selectedSingers)
    localStorage.setItem("catchmusic_preferences", JSON.stringify(selectedSingers));

    setTimeout(() => {
      router.replace("/favorite-singers");
    }, 600);
  };

  const getSortIcon = (field: "followers" | "rating") => {
    if (sortBy !== field) return "↕";
    return sortDirection === "desc" ? "↓" : "↑";
  };

  const handleSort = (field: "followers" | "rating") => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-10 flex items-center justify-center">
      {/* Background Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glow-gold),transparent_70%)] pointer-events-none opacity-30" />

      {/* Broader Parent Card (max-w-7xl) */}
      <main className="w-full max-w-7xl rounded-3xl border border-border-light bg-gradient-to-b from-surface to-card p-6 sm:p-10 lg:p-12 shadow-2xl relative z-10 space-y-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-30 pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface px-3.5 py-1 shadow-sm">
              <Music4 size={12} className="text-accent" />
              <span className="text-[10px] font-semibold tracking-widest text-muted uppercase">
                Onboarding Setup
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-pri">
              Choose Your Top <span className="text-accent">3 Artists</span>
            </h1>
            <p className="text-sm text-sec max-w-xl">
              Select 3 favorite singers to calibrate your personalized music discovery engine.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-bg-ter border border-border-light px-6 py-3.5 rounded-2xl h-max self-start md:self-center shadow-sm">
            <span className="text-xs font-bold text-muted tracking-wider uppercase">
              Selected
            </span>
            <div className="text-2xl font-black tracking-tight text-accent">
              {selectedIds.length}{" "}
              <span className="text-muted font-normal text-base">/ 3</span>
            </div>
          </div>
        </div>

        {/* Search, Category Filters, and Sort Controls */}
        <div className="relative z-10 space-y-5 pb-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artist by name or genre..."
                className="w-full bg-bg-ter border border-border-light text-pri placeholder:text-muted text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-accent transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-pri transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <span className="text-xs font-semibold text-muted uppercase">
                Sort:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSort("followers")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                    sortBy === "followers"
                      ? "bg-accent/20 text-accent border border-accent/40 font-semibold"
                      : "border border-border-light bg-bg-ter text-sec hover:bg-surface"
                  }`}
                >
                  Followers {getSortIcon("followers")}
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("rating")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                    sortBy === "rating"
                      ? "bg-accent/20 text-accent border border-accent/40 font-semibold"
                      : "border border-border-light bg-bg-ter text-sec hover:bg-surface"
                  }`}
                >
                  Rating {getSortIcon("rating")}
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs font-semibold text-muted uppercase mr-1">
              Genres:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-accent text-bg shadow-md"
                  : "border border-border-light bg-bg-ter text-sec hover:bg-surface hover:text-pri"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-accent text-bg shadow-md"
                    : "border border-border-light bg-bg-ter text-sec hover:bg-surface hover:text-pri"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="relative z-10 text-xs text-sec">
          Showing <span className="font-bold text-pri">{filteredSingers.length}</span>{" "}
          {filteredSingers.length === 1 ? "artist" : "artists"}
          {selectedCategory && ` in ${selectedCategory}`}
        </div>

        {/* Spotify-Style Grid Layout (2 to 4 columns) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedSingers.map((singer) => (
            <SingerCard
              key={singer.id}
              singer={singer}
              isSelected={selectedIds.includes(singer.id)}
              disabled={selectedIds.length >= 3}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredSingers.length === 0 && (
          <div className="relative z-10 text-center py-16 space-y-3">
            <Music4 size={48} className="mx-auto text-muted/40 animate-pulse" />
            <h3 className="text-lg font-bold text-pri">No artists found</h3>
            <p className="text-xs text-sec">
              Try adjusting your search or selecting a different category filter.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        {filteredSingers.length > 0 && (
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 pt-6 border-t border-border">
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-bg-ter px-6 py-2.5 text-sec hover:text-pri font-semibold text-xs tracking-wide transition-all duration-300 hover:bg-surface active:scale-95 group shadow-sm"
              >
                <span>Show More Artists</span>
                <ArrowDown
                  size={14}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedIds.length !== 3 || isSubmitting}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-hover text-bg font-bold text-sm tracking-wide shadow-lg transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer py-3.5 px-8"
            >
              <span>
                {isSubmitting ? "Finalizing Engine..." : "Complete Setup"}
              </span>
              {!isSubmitting && <ArrowRight size={16} strokeWidth={2.5} />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
