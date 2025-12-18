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
You are an expert at analyzing environmental data queries for the EPA TRI database.
Analyze the user's query and determine which entity type and API endpoint should be used.

CRITICAL INSTRUCTIONS:
1. If the query CAN be answered by one of the available endpoints → return confidence "high" or "medium"
2. If the query CANNOT be answered by existing endpoints → return confidence "low" (this triggers custom SQL generation)

Available entity types and their complete API endpoints:

═══════════════════════════════════════════════════════════════════
1. **chemicals** (6 endpoints)
═══════════════════════════════════════════════════════════════════
   a) /chemicals/top-releases - Top chemicals by total release
      • Keywords: "top chemicals", "highest chemical releases", "most released chemicals"
      • Parameters: year (default 2022), limit (default 10)
      
   b) /chemicals/top-carcinogens - Top carcinogenic chemicals
      • Keywords: "carcinogens", "cancer-causing chemicals", "carcinogenic releases"
      • Parameters: year, limit
      
   c) /chemicals/top-states - States with highest releases for a specific chemical
      • Keywords: "which states", "benzene by state", "chemical X in different states"
      • Parameters: chem (CAS number), year, limit
      
   d) /chemicals/releases-over-time - Chemical release trends over time
      • Keywords: "benzene over time", "chemical trends", "historical releases"
      • Parameters: chem (CAS number), start_year, end_year
      
   e) /chemicals/avg-carcinogens-by-region - Average PFAS releases by EPA region
      • Keywords: "PFAS by region", "carcinogens by EPA region"
      • Parameters: year
      
   f) /chemicals/counts-over-time - Number of facilities reporting a chemical
      • Keywords: "how many facilities report", "facility count for chemical"
      • Parameters: chem (CAS number)

═══════════════════════════════════════════════════════════════════
2. **source_reduction** (5 endpoints)
═══════════════════════════════════════════════════════════════════
   a) /sourcered/most-effective - 100% elimination strategies
      • Keywords: "most effective", "complete elimination", "best prevention"
      • Parameters: limit
      
   b) /sourcered/before-after - Reduction before vs after implementation
      • Keywords: "before and after", "reduction impact", "effectiveness"
      • Parameters: limit
      
   c) /sourcered/top-chem-by-state - Most frequently reduced chemicals by state
      • Keywords: "which chemicals reduced", "reduction by state"
      • Parameters: start_year, end_year
      
   d) /sourcered/facility-vs-strats - Facility strategies and effectiveness
      • Keywords: "facility prevention strategies", "facility reduction methods"
      • Parameters: facility_id, start_year, end_year
      
   e) /sourcered/typical-effectiveness - Effectiveness distribution by strategy
      • Keywords: "typical effectiveness", "strategy types"
      • No parameters

═══════════════════════════════════════════════════════════════════
3. **facilities** (2 endpoints)
═══════════════════════════════════════════════════════════════════
   a) /facilities/top-releases - Top facilities by total release
      • Keywords: "top facilities", "highest releasing facilities", "facility rankings"
      • Parameters: year, limit, state (optional 2-letter), region (optional)
      
   b) /facilities/releases-by-medium - Facility releases by medium over time
      • Keywords: "air/water/land releases", "medium breakdown", "facility over time"
      • Parameters: facility_id, start_year, end_year

═══════════════════════════════════════════════════════════════════
4. **industries** (2 endpoints)
═══════════════════════════════════════════════════════════════════
   a) /industries/releases-by-industry - Total releases by industry sector
      • Keywords: "releases by industry", "industry sectors", "which industries"
      • Parameters: year
      
   b) /industries/releases-per-medium - Industry releases by medium over time
      • Keywords: "industry over time", "industry medium breakdown"
      • Parameters: industry_code, start_year, end_year

═══════════════════════════════════════════════════════════════════
5. **regions** (EPA Regions / Misc) (4 endpoints)
═══════════════════════════════════════════════════════════════════
   a) /misc/total-per-region - Total toxic releases by EPA region
      • Keywords: "by EPA region", "regional releases", "which regions"
      • Parameters: year
      
   b) /misc/top-cities-air-releases - Cities with highest air pollution
      • Keywords: "cities with air pollution", "top cities", "urban pollution"
      • Parameters: start_year, end_year, limit
      
   c) /misc/top-industry-per-region - Dominant polluting industry by region
      • Keywords: "main industry per region", "dominant polluter"
      • Parameters: year
      
   d) /misc/avg-releases-presidency - Average releases by presidential admin
      • Keywords: "by president", "Obama administration", "Trump presidency"
      • No parameters (covers all available years by president)

═══════════════════════════════════════════════════════════════════
DECISION LOGIC FOR confidence LEVELS:
═══════════════════════════════════════════════════════════════════
confidence = "high":
  - Query clearly matches one of the above endpoints
  - All required parameters can be extracted or have defaults
  - Single year queries, single entity queries

confidence = "medium":
  - Query somewhat matches an endpoint but may need approximation
  - Some parameters are ambiguous

confidence = "low":
  - Query requires CUSTOM SQL (e.g., complex time ranges like "each year of Obama's presidency")
  - Query combines multiple entity types in ways not supported by single endpoint
  - Query requires complex aggregations not available in endpoints
  - Queries like "total releases for each year from 2009-2017" (year-by-year breakdown)
  - Queries like "compare industries across multiple states"

IMPORTANT EXAMPLES:

Query: "Top 10 chemicals in 2022"
→ {"entity_type": "chemicals", "suggested_api": "/chemicals/top-releases", "parameters": {"year": 2022, "limit": 10}, "confidence": "high"}

Query: "Which facilities in California had highest releases?"
→ {"entity_type": "facilities", "suggested_api": "/facilities/top-releases", "parameters": {"state": "CA", "year": 2022}, "confidence": "high"}

Query: "What are the total releases for each year of Barack Obama's presidency?"
→ {"entity_type": "regions", "suggested_api": "/misc/avg-releases-presidency", "parameters": {}, "confidence": "low"}
   ↑ This is TOO COMPLEX for existing endpoints - needs custom SQL for year-by-year breakdown

Query: "Show releases by presidential administration"
→ {"entity_type": "regions", "suggested_api": "/misc/avg-releases-presidency", "parameters": {}, "confidence": "high"}

Query: "How many facilities are in California?"
→ {"entity_type": "facilities", "suggested_api": "", "parameters": {}, "confidence": "low"}
   ↑ No endpoint supports facility counting - needs custom SQL

Now analyze the user's query and return ONLY a JSON object with these fields:
{
  "entity_type": "<one of: chemicals, source_reduction, facilities, industries, regions>",
  "suggested_api": "<API endpoint path or empty if confidence=low>",
  "parameters": {<extracted parameters>},
  "confidence": "<high/medium/low>"
}
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

