import { getPrompt,setPrompt } from "./promptmod";

export async function GET(req) {
  try {
    const prompt = await getPrompt();
    return new Response(JSON.stringify({ prompt }), { status: 200 });
  } catch (error) {
    console.error("Error retrieving prompt:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve prompt from Redis." }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { newPrompt } = body;

    if (!newPrompt || typeof newPrompt !== "string") {
      return new Response(JSON.stringify({ error: "Invalid prompt data" }), { status: 400 });
    }

    await setPrompt(newPrompt);
    return new Response(JSON.stringify({ message: "Prompt updated successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error setting prompt:", error);
    return new Response(JSON.stringify({ error: "Failed to set prompt in Redis." }), { status: 500 });
  }
}
