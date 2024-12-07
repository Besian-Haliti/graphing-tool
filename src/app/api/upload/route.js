import { getPrompt } from "../prompt/promptmod";

export async function POST(req) {
    try {
      // Parse the incoming request body
      const body = await req.json();
      const { question, graphData } = body;
      console.log("Incoming question and graph data:", question, JSON.stringify(graphData,null,2));
  
      // Validate the input graph data
      if (!graphData || typeof graphData !== "object") {
        return new Response(
          JSON.stringify({ error: "Invalid graph data format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
  
      // Serialize and truncate graph data if necessary
      const serializedGraphData = JSON.stringify(graphData, null, 2);
      const maxGraphDataLength = 5000;
      const truncatedGraphData =
        serializedGraphData.length > maxGraphDataLength
          ? serializedGraphData.substring(0, maxGraphDataLength) + "..."
          : serializedGraphData;
  
      // Format the prompt
      const databaseprompt = await getPrompt();
      const prompt = `\n\nHuman: ${databaseprompt}
      You have received a question and graph data in JSON format.
      Question: "${question}"
      Here is the graph data for you to analyze, create the graph using the data then analyze it: ${truncatedGraphData}\n\nAssistant:`;
  
      // Make a POST request to the Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          prompt: prompt,
          model: "claude-2.1",
          max_tokens_to_sample: 500,
          stop_sequences: ["\n\nHuman:"],
        }),
      });
  
      // Parse and handle the response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details from Anthropic API:", errorData);
        throw new Error(
          `Claude API returned an error: ${errorData.message || "Unknown error"}`
        );
      }
  
      const responseData = await response.json();
      console.log(responseData);
  
      // Send the response from Anthropic back to the client
      return new Response(
        JSON.stringify({ response: responseData.completion.trim() }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in POST handler:", error);
  
      return new Response(
        JSON.stringify({
          error: "Failed to process the graph data",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  
  export async function OPTIONS() {
    // Handle CORS preflight requests
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  
