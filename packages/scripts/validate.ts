import fs from "node:fs/promises";

type SingerResult = {
  name: string;
  status: "VERIFIED" | "MISSING" | "RETRY";
  image?: string;
  article?: string;
  reason?: string;
};

const OUTPUT_FILE = "verified-singer-images.json";

const REQUEST_DELAY_MS = 1500;
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 3000;

const USER_AGENT =
  "CatchMusicSingerImageValidator/1.0 (personal project; image validation)";

const singers = [
  // Hindi singers and composers
  "Arijit Singh",
  "Pritam",
  "Shreya Ghoshal",
  "Sonu Nigam",
  "Neeti Mohan",
  "Vishal Mishra",
  "Jubin Nautiyal",
  "Atif Aslam",
  "Sonu Kakkar",
  "Sunidhi Chauhan",
  "Mohit Chauhan",
  "KK",
  "Kumar Sanu",
  "Udit Narayan",
  "Alka Yagnik",
  "Kishore Kumar",
  "Lata Mangeshkar",
  "Shankar Mahadevan",
  "Vishal Dadlani",
  "Shekhar Ravjiani",
  "B Praak",
  "Asees Kaur",

  // Indian rappers
  "Badshah",
  "Yo Yo Honey Singh",
  "KR$NA",
  "Emiway Bantai",
  "Raftaar",
  "DIVINE",
  "MC Stan",
  "Seedhe Maut",
  "Ikka",
  "Fotty Seven",
  "King",
  "MC Square",
  "Loka",
  "Dino James",
  "Paradox",
  "Yashraj",

  // Haryanvi artists
  "Fazilpuria",
  "Masoom Sharma",
  "Amit Saini Rohtakiya",
  "Raju Punjabi",
  "KD Desi Rock",
  "Gulzaar Chhaniwala",
  "Khasa Aala Chahar",

  // Bhojpuri singers
  "Khesari Lal Yadav",
  "Pawan Singh",
  "Manoj Tiwari",
  "Dinesh Lal Yadav",
  "Ritesh Pandey",
  "Shilpi Raj",
  "Ankush Raja",
  "Arvind Akela Kallu",
  "Pramod Premi Yadav",
  "Kalpana Patowary",
] as const;

// Some display names differ from their Wikipedia article titles.
const articleTitles: Record<string, string> = {
  KK: "Krishnakumar Kunnath",
  "KR$NA": "Krishna Kaul (rapper)",
  "Yo Yo Honey Singh": "Yo Yo Honey Singh",
  DIVINE: "Divine (rapper)",
  "MC Stan": "MC Stan",
  "Seedhe Maut": "Seedhe Maut",
  "Fotty Seven": "Fotty Seven",
  King: "King (rapper)",
  Loka: "Loka (rapper)",
  Paradox: "Paradox (rapper)",
  Yashraj: "Yashraj (rapper)",
  "Dinesh Lal Yadav": "Dinesh Lal Yadav",
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function getRetryDelay(response: Response | null, attempt: number) {
  const retryAfter = response?.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 120_000);
    }

    const date = Date.parse(retryAfter);

    if (!Number.isNaN(date)) {
      return Math.min(Math.max(date - Date.now(), 0), 120_000);
    }
  }

  return Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, 60_000);
}

/**
 * Performs a request with retries for rate limits and temporary server errors.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response: Response | null = null;

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json, image/*, */*",
          ...init.headers,
        },
      });

      const retryable =
        response.status === 429 ||
        response.status === 408 ||
        response.status >= 500;

      if (!retryable || attempt === MAX_RETRIES) {
        return response;
      }

      const delay = getRetryDelay(response, attempt);

      // Release the response body before retrying.
      await response.body?.cancel().catch(() => {});

      console.log(
        `  HTTP ${response.status}. Retry ${
          attempt + 1
        }/${MAX_RETRIES} in ${Math.ceil(delay / 1000)}s`,
      );

      await sleep(delay);
    } catch (error) {
      lastError = error;

      if (attempt === MAX_RETRIES) {
        break;
      }

      const delay = Math.min(
        INITIAL_BACKOFF_MS * 2 ** attempt,
        60_000,
      );

      console.log(
        `  Network error. Retry ${
          attempt + 1
        }/${MAX_RETRIES} in ${Math.ceil(delay / 1000)}s`,
      );

      await sleep(delay);
    }
  }

  throw new Error(
    `Request failed after ${MAX_RETRIES + 1} attempts: ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`,
  );
}

/**
 * Checks the image URL without downloading the complete image.
 */
async function validateImageUrl(
  imageUrl: string,
): Promise<{ valid: boolean; reason?: string }> {
  let response: Response | null = null;

  try {
    // HEAD is preferable because it avoids downloading the image.
    response = await fetchWithRetry(imageUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    // Some image hosts don't support HEAD.
    if (
      response.status === 405 ||
      response.status === 403 ||
      response.status === 501
    ) {
      await response.body?.cancel().catch(() => {});

      response = await fetchWithRetry(imageUrl, {
        method: "GET",
        headers: {
          Range: "bytes=0-1023",
        },
        redirect: "follow",
      });
    }

    if (response.status === 429) {
      return {
        valid: false,
        reason: "Image server rate limit reached; retry later",
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        reason: `Image server returned HTTP ${response.status}`,
      };
    }

    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.startsWith("image/")) {
      return {
        valid: false,
        reason: `Expected an image but received ${
          contentType || "an unknown content type"
        }`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason:
        error instanceof Error ? error.message : String(error),
    };
  } finally {
    await response?.body?.cancel().catch(() => {});
  }
}

/**
 * Gets the singer's article image from the Wikipedia REST API.
 */
async function getArticleImage(
  name: string,
): Promise<SingerResult> {
  const title = articleTitles[name] ?? name;

  const articleUrl =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title.replaceAll(" ", "_"));

  let articleResponse: Response;

  try {
    articleResponse = await fetchWithRetry(articleUrl);
  } catch (error) {
    return {
      name,
      status: "RETRY",
      reason:
        error instanceof Error ? error.message : String(error),
    };
  }

  if (articleResponse.status === 429) {
    return {
      name,
      status: "RETRY",
      reason: "Wikipedia rate limit reached; run the validator again later",
    };
  }

  if (articleResponse.status === 404) {
    return {
      name,
      status: "MISSING",
      reason: `Wikipedia article not found: ${title}`,
      article: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        title.replaceAll(" ", "_"),
      )}`,
    };
  }

  if (!articleResponse.ok) {
    return {
      name,
      status: "RETRY",
      reason: `Wikipedia returned HTTP ${articleResponse.status}`,
    };
  }

  let article: {
    originalimage?: { source?: string };
    thumbnail?: { source?: string };
    content_urls?: {
      desktop?: { page?: string };
    };
  };

  try {
    article = await articleResponse.json();
  } catch {
    return {
      name,
      status: "RETRY",
      reason: "Could not parse Wikipedia's response",
    };
  }

  const imageUrl =
    article.originalimage?.source ??
    article.thumbnail?.source;

  const articlePage =
    article.content_urls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeURIComponent(
      title.replaceAll(" ", "_"),
    )}`;

  if (!imageUrl) {
    return {
      name,
      status: "MISSING",
      reason: "No image provided by the Wikipedia article",
      article: articlePage,
    };
  }

  const imageCheck = await validateImageUrl(imageUrl);

  if (!imageCheck.valid) {
    const isRateLimit =
      imageCheck.reason?.includes("rate limit") ?? false;

    return {
      name,
      status: isRateLimit ? "RETRY" : "MISSING",
      image: imageUrl,
      article: articlePage,
      reason: imageCheck.reason ?? "Image validation failed",
    };
  }

  return {
    name,
    status: "VERIFIED",
    image: imageUrl,
    article: articlePage,
  };
}

/**
 * Main validation process.
 */
async function main() {
  const results: SingerResult[] = [];

  console.log(`Validating images for ${singers.length} singers...\n`);

  for (let index = 0; index < singers.length; index++) {
    const name = singers[index];

    console.log(
      `[${index + 1}/${singers.length}] Checking ${name}...`,
    );

    const result = await getArticleImage(name);

    results.push(result);

    if (result.status === "VERIFIED") {
      console.log(`  ✓ ${name}: ${result.image}`);
    } else {
      console.log(
        `  ✗ ${name}: ${result.status} - ${result.reason}`,
      );

      if (result.article) {
        console.log(`    Article: ${result.article}`);
      }

      if (result.image) {
        console.log(`    Candidate image: ${result.image}`);
      }
    }

    // Save after every singer so progress isn't lost if execution stops.
    await fs.writeFile(
      OUTPUT_FILE,
      JSON.stringify(results, null, 2),
      "utf8",
    );

    if (index < singers.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const verified = results.filter(
    (result) => result.status === "VERIFIED",
  );

  const missing = results.filter(
    (result) => result.status === "MISSING",
  );

  const retry = results.filter(
    (result) => result.status === "RETRY",
  );

  console.log("\n========== VALIDATION SUMMARY ==========");
  console.log(`Total singers: ${results.length}`);
  console.log(`Verified image URLs: ${verified.length}`);
  console.log(`Missing or invalid candidates: ${missing.length}`);
  console.log(`Need another attempt: ${retry.length}`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);
  console.log("=========================================\n");

  if (retry.length > 0) {
    console.log("Singers requiring another attempt:");

    for (const result of retry) {
      console.log(`- ${result.name}: ${result.reason}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error("Validation failed:", error);
  process.exitCode = 1;
});
