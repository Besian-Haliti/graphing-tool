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
      const maxGraphDataLength = 5000; // Ensure graph data doesn't exceed token limits
      const truncatedGraphData =
        serializedGraphData.length > maxGraphDataLength
          ? serializedGraphData.substring(0, maxGraphDataLength) + "..."
          : serializedGraphData;
  
      // Format the prompt
      const prompt = `\n\nHuman: You are an A-level economics teacher. You have received a question and graph data in JSON format. 
      Question: "${question}"
      Only provide a JSON response no matter what information is given. Refer to the student as you in your answer. 
      If you are unable to score, just give it a 0 out of 4. Analyze the question and graph data, and provide a response in the following format:
      {"score": "?/4", "strengths": ["..."], "weaknesses": ["..."], "tip": "..."}
      Use the OCR A-Level Spec and diagrams as a reference for your marking.
      Here is the graph data for you to analyze: ${truncatedGraphData}\n\nAssistant:`;
  
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
  