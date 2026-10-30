import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";

let extractor: any = null;

async function getModel() {
    if (!extractor) {
        extractor = await pipeline(
            "feature-extraction",
            MODEL
        );
    }

    return extractor;
}

export async function generateEmbedding(text: string) {
    const model = await getModel();

    const output = await model(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data) as number[];
}