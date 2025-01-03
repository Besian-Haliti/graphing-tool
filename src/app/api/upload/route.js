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
  
      const msPrompt = `Create an OCR A-level Economics style mark scheme for a (4 mark) graph question for this question:\n\n${question}`;
      const summaryResponse = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          prompt: msPrompt,
          max_tokens: 500,
        }),
      });
      const summaryData = await summaryResponse.json();
      const markscheme = summaryData.choices?.[0]?.text?.trim() || "No response from OpenAI API.";

          

      // Format the prompt
      const databaseprompt = await getPrompt();
      const prompt = `\n\nHuman:
      You have received a question and graph data in JSON format.
      Question: "${question}". Here is the Mark Scheme for the question ${markscheme}
      Here is the graph data for you to analyze, create the graph using the data then 
      mark it against the mark scheme: ${truncatedGraphData}\n\nAssistant:`;
  
      // Make a POST request to the Anthropic API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: databaseprompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 500,
          stop: ["\n\nHuman:"],
        }),
      });
  
      // Parse and handle the response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details from OpenAI:", errorData);
        throw new Error(
          `OpenAI returned an error: ${errorData.message || "Unknown error"}`
        );
      }
  
      const responseData = await response.json();
      console.log(responseData);
  
      // Send the response from OpenAI back to the client
      return new Response(
        JSON.stringify({ response: responseData.choices[0].message.content.trim() }),
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
  