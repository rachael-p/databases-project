from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set.")
client = OpenAI(api_key=openai_api_key)

class QueryAnalysisRequest(BaseModel):
    query: str

class QueryAnalysisResponse(BaseModel):
    entity_type: str  # "facilities", "chemicals", "industries", "source_reduction", "epa_regions"
    suggested_api: str
    parameters: dict
    confidence: str  # "high", "medium", "low"

ANALYSIS_PROMPT = """
You are an expert at analyzing environmental data queries. 
Analyze the user's query and determine which entity type and API endpoint should be used.

IMPORTANT: Pay close attention to keywords to determine the PRIMARY focus:

Available entity types and their APIs:

1. **facilities** - For queries PRIMARILY about specific facilities, plants, or locations
   - Keywords: "which facilities", "top facilities", "facility names", "facility releases", "where", "location"
   - APIs: /facilities/top-releases, /facilities/releases-by-medium
   
2. **industries** - For queries PRIMARILY about industry sectors, industry types
   - Keywords: "by industry", "industry sector", "which industries", "industry types"
   - APIs: /industries/releases-by-industry, /industries/releases-per-medium
   
3. **chemicals** - For queries PRIMARILY about specific chemicals, substances, carcinogens, PFAS
   - Keywords: "chemicals", "carcinogens", "PFAS", "substances", "which chemicals"
   - Currently only mock data available
   
4. **source_reduction** - For queries PRIMARILY about pollution prevention, waste reduction activities, recycling
   - Keywords: "source reduction", "pollution prevention", "waste reduction", "recycling", "reduction activities", "prevention activities"
   - Currently only mock data available
   
5. **epa_regions** - For queries PRIMARILY about EPA regions, geographic regions
   - Keywords: "EPA region", "region", "regional", "by region"
   - Currently only mock data available

DECISION RULES:
- If query mentions "source reduction" or "reduction activities" as the MAIN subject → use source_reduction
- If query asks "which facilities have X" where X is about source reduction → use source_reduction (focus on the activity, not the facility)
- If query asks "facilities in California with high releases" → use facilities (focus on facility location)
- If query asks "releases by industry" → use industries (focus on industry type)

Extract parameters from the query:
- year: if mentioned (default: 2022)
- state: if mentioned (2-letter code like CA, TX)
- n/limit: number of results (default: 10)
- industry_code: if specific industry mentioned

Return a JSON object with:
{
  "entity_type": "<one of: facilities, industries, chemicals, source_reduction, epa_regions>",
  "suggested_api": "<API endpoint path>",
  "parameters": {<extracted parameters>},
  "confidence": "<high/medium/low>"
}

Examples:
Query: "Which facilities in California had the highest releases in 2022?"
Response: {"entity_type": "facilities", "suggested_api": "/facilities/top-releases", "parameters": {"year": 2022, "state": "CA", "n": 10}, "confidence": "high"}

Query: "What are the total releases by industry in 2021?"
Response: {"entity_type": "industries", "suggested_api": "/industries/releases-by-industry", "parameters": {"year": 2021}, "confidence": "high"}

Query: "Which chemicals are carcinogens?"
Response: {"entity_type": "chemicals", "suggested_api": "/chemicals/carcinogens", "parameters": {}, "confidence": "high"}

Query: "Which facilities have source reduction activities?"
Response: {"entity_type": "source_reduction", "suggested_api": "/source-reduction/facilities", "parameters": {}, "confidence": "high"}

Query: "Show me pollution prevention activities"
Response: {"entity_type": "source_reduction", "suggested_api": "/source-reduction/activities", "parameters": {}, "confidence": "high"}

Query: "What are the top recycling programs?"
Response: {"entity_type": "source_reduction", "suggested_api": "/source-reduction/top", "parameters": {}, "confidence": "high"}

Now analyze the user's query and return ONLY the JSON object, no explanations.
"""

@router.post("/query", response_model=QueryAnalysisResponse)
async def analyze_query(request: QueryAnalysisRequest):
    """
    Analyze a natural language query and determine which API endpoint to use.
    """
    try:
        messages = [
            {"role": "system", "content": ANALYSIS_PROMPT},
            {"role": "user", "content": request.query}
        ]

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",  # This model supports JSON mode
            messages=messages,
            max_tokens=300,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content.strip())
        
        return QueryAnalysisResponse(
            entity_type=result.get("entity_type", "facilities"),
            suggested_api=result.get("suggested_api", "/facilities/top-releases"),
            parameters=result.get("parameters", {}),
            confidence=result.get("confidence", "medium")
        )
    except Exception as e:
        print(f"Error in query analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Query analysis failed: {str(e)}")

