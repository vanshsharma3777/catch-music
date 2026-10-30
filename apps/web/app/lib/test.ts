import { generateEmbedding } from "../../../../packages/recommendation/src/recommendation-engine";
import { createSongContext } from "../../../../packages/recommendation/src/song-context";


const song = {
  id: "chsZmHTf",
  name: "Fakira",
  year: "2019",
  language: "hindi",

  album: {
    name: "Student of the Year 2",
  },

  artists: {
    primary: [
      {
        name: "Vishal &amp; Shekhar",
      },
    ],
  },
};

async function main() {
  const context = createSongContext(song);

  console.log("Song Context:", context);

  const embedding = await generateEmbedding(context);

  console.log("Embedding dimensions:", embedding.length);

  console.log("First 10 values:", embedding.slice(0, 10));
}

main();