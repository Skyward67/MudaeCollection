const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_QUERY = `
  query ($name: String) {
    Character(search: $name) {
      image { large }
      media {
        nodes {
          title { romaji english native }
        }
      }
    }
  }
`;

// Strips everything but lowercase letters and digits for loose comparison
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function serieMatchesTitles(serie: string, titles: (string | undefined)[]): boolean {
  const normSerie = normalize(serie);
  return titles.some((t) => {
    if (!t) return false;
    const normTitle = normalize(t);
    return normTitle.includes(normSerie) || normSerie.includes(normTitle);
  });
}

async function fetchFromAniList(name: string, serie?: string): Promise<string | null> {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { name } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const character = json.data?.Character;
    if (!character?.image?.large) return null;

    if (serie) {
      const mediaTitles: (string | undefined)[] = (character.media?.nodes ?? []).flatMap(
        (n: { title: { romaji?: string; english?: string; native?: string } }) => [
          n.title?.romaji,
          n.title?.english,
          n.title?.native,
        ]
      );
      if (!serieMatchesTitles(serie, mediaTitles)) return null;
    }

    return character.image.large as string;
  } catch {
    return null;
  }
}

async function fetchFromWikipedia(name: string, serie?: string): Promise<string | null> {
  try {
    const q = [name, serie].filter(Boolean).join(" ");
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=1&format=json&origin=*`
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const title: string | undefined = searchJson.query?.search?.[0]?.title;
    if (!title) return null;

    const pageRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (!pageRes.ok) return null;
    const pageJson = await pageRes.json();

    if (serie) {
      const text: string = [pageJson.title, pageJson.extract].join(" ");
      if (!normalize(text).includes(normalize(serie))) return null;
    }

    return (pageJson.thumbnail?.source as string) ?? null;
  } catch {
    return null;
  }
}

// Vite proxies /proxy/mudae/* → https://mudae.net/* with browser headers (see vite.config.ts)
const MUDAE_SEARCH_URL = (name: string) =>
  `/proxy/mudae/search?type=character&name=${encodeURIComponent(name)}`;

async function fetchFromMudae(name: string): Promise<string | null> {
  try {
    const cleanName = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const searchRes = await fetch(MUDAE_SEARCH_URL(cleanName));
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();

    // Extract first character page link
    const linkMatch = searchHtml.match(/href="(\/character\/\d+\/[^"]+)"/);
    if (!linkMatch) return null;

    // Fetch the character page and extract the image
    await new Promise(r => setTimeout(r, 800));
    const pageRes = await fetch(`/proxy/mudae${linkMatch[1]}`);
    if (!pageRes.ok) return null;
    const pageHtml = await pageRes.text();

    // Image URL pattern
    const imgMatch = pageHtml.match(/src="(\/uploads\/\d+\/[^"]+)"/);
    if (!imgMatch) return null;

    return `https://mudae.net${imgMatch[1]}`;
  } catch {
    return null;
  }
}

export async function fetchCharacterImage(name: string, serie?: string): Promise<string | null> {
  const mudae = await fetchFromMudae(name);
  if (mudae) return mudae;
  const anilist = await fetchFromAniList(name, serie);
  if (anilist) return anilist;
  return fetchFromWikipedia(name, serie);
}
