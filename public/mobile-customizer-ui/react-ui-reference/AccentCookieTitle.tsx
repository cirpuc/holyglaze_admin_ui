import { charToFanlsteSwash, swashIndicesForWord } from "@/src/lib/fanlsteGlyphs";

export type AccentCookieTitleProps = {
  name: string;
};

/**
 * Cookie name: fanlste on the first word (up to 2 swash glyphs);
 * remaining words in body serif.
 */
export default function AccentCookieTitle({ name }: AccentCookieTitleProps) {
  const trimmed = name.trim();
  const spaceIdx = trimmed.indexOf(" ");
  const firstWord = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const restName = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx);

  const swashAt = swashIndicesForWord(firstWord, 2);

  return (
    <>
      <span className="constructor-hero__name-accent">
        {firstWord.split("").map((ch, index) => {
          const swash = swashAt.has(index) ? charToFanlsteSwash(ch) : null;
          return (
            <span
              key={`${ch}-${index}`}
              className={
                swash
                  ? "constructor-hero__name-swash"
                  : "constructor-hero__name-plain"
              }
            >
              {swash ?? ch}
            </span>
          );
        })}
      </span>
      {restName ? (
        <span className="constructor-hero__name-rest">{restName}</span>
      ) : null}
    </>
  );
}
