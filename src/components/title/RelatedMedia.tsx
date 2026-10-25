"use client";

import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";
import type { AniListRelation } from "@/types/anime";
import { Badge } from "@/components/ui/Badge";

const RELATION_LABELS: Record<string, string> = {
  SEQUEL: "Sequel",
  PREQUEL: "Prequel",
  PARENT: "Parent story",
  SIDE_STORY: "Side story",
  SPIN_OFF: "Spin-off",
  ALTERNATIVE: "Alternative version",
  SUMMARY: "Summary",
  COMPILATION: "Compilation",
  CONTAINS: "Contains",
  CHARACTER: "Character",
  OTHER: "Related",
  SOURCE: "Source material",
};

interface RelatedMediaProps {
  relations: AniListRelation[];
}

export function RelatedMedia({ relations }: RelatedMediaProps) {
  // Filter to only show anime relations (exclude manga/source material)
  const animeRelations = relations.filter((rel) => rel.node.type === "ANIME");

  if (animeRelations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">Related Anime</h2>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animeRelations.map((relation) => {
          const title = relation.node.title.english ?? relation.node.title.romaji;
          
          return (
            <Link
              key={relation.id}
              href={`/title/${relation.node.id}`}
              className="group flex gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-line-strong hover:bg-elevated"
            >
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated">
                {(relation.node.coverImage.extraLarge ?? relation.node.coverImage.large) ? (
                  <Image
                    src={relation.node.coverImage.extraLarge ?? relation.node.coverImage.large}
                    alt={title}
                    fill
                    quality={85}
                    sizes="64px"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-6 w-6 text-subtle" aria-hidden />
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-1.5 text-[10px]">
                  {RELATION_LABELS[relation.relationType] ?? relation.relationType}
                </Badge>
                
                <h3 className="line-clamp-2 text-sm font-medium text-fg transition group-hover:text-accent">
                  {title}
                </h3>
                
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  {relation.node.format && (
                    <span>{relation.node.format.replace(/_/g, " ")}</span>
                  )}
                  {relation.node.seasonYear && (
                    <>
                      <span className="text-subtle">•</span>
                      <span>{relation.node.seasonYear}</span>
                    </>
                  )}
                  {relation.node.status === "RELEASING" && (
                    <>
                      <span className="text-subtle">•</span>
                      <span className="text-green-500">Airing</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
