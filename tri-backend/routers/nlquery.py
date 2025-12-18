"""Natural Language Query endpoint using OpenAI."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from db import fetch_all

load_dotenv()

router = APIRouter(prefix="/nlquery", tags=["nlquery"])

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class NLQueryRequest(BaseModel):
    query: str

class NLQueryResponse(BaseModel):
    query: str
    query_type: str  # "existing_endpoint" or "custom_sql"
    endpoint: str | None = None
    params: dict | None = None
    sql: str | None = None
    results: list | None = None

# Available endpoints documentation
AVAILABLE_ENDPOINTS = """
Available Endpoints and Queries:

1. GET /facilities/names
   - Returns all facility names with IDs
   - No parameters

2. GET /facilities/top-releases
   - Returns top N facilities by total release for a year
   - Parameters: year (required), n (default 10), state (optional 2-letter code), 
                 region (optional 1-2 digit), industry_code (optional int)
   - Example: "Show top 10 facilities with highest releases in 2022"
   - Example: "What are the top 25 facilities in California in 2021?"

3. GET /facilities/releases-by-medium
   - Returns releases by medium (air, water, land) for a facility over years
   - Parameters: facility_id (required), start_year, end_year
   - Example: "Show releases by medium for facility ABC123 from 2010 to 2020"

4. GET /industries/releases-by-industry
   - Returns total releases by industry for a year
   - Parameters: year (required)
   - Example: "Show releases by industry in 2022"

5. GET /industries/releases-per-medium
   - Returns releases per medium for an industry over years
   - Parameters: industry_code (required), start_year, end_year
   - Example: "Show releases per medium for industry 327 from 2015 to 2020"

Database Schema (for custom SQL):
- Facility (facility_id, facility_name, state, region_code)
- Form (doc_ctrl_num, facility_id, year, industry_code)
- ReleaseRecord (doc_ctrl_num, medium, total_release)
- Industry (industry_code, industry_desc)
"""

@router.post("/", response_model=NLQueryResponse)
async def natural_language_query(request: NLQueryRequest):
    """
    Process a natural language query about EPA TRI data.
    First tries to match with existing endpoints, then generates custom SQL if needed.
    """
    
    query = request.query
    
    if not query or query.strip() == "":
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Step 1: Ask LLM to check if existing endpoints can be used
    system_prompt = f"""You are a helpful assistant that matches natural language queries to API endpoints.

{AVAILABLE_ENDPOINTS}

Your task:
1. Analyze the user's query
2. If it can be answered using one of the available endpoints, respond with:
   {{"type": "existing_endpoint", "endpoint": "/path/to/endpoint", "params": {{"param1": value1, "param2": value2}}}}
3. If NO existing endpoint can answer the query, respond with:
   {{"type": "custom_sql", "sql": "SELECT ... FROM ... WHERE ..."}}

Rules:
- For state parameters, use 2-letter codes (CA, TX, NY, etc.)
- For year parameters, use 4-digit integers (2022, 2021, etc.)
- Always include the full endpoint path
- Return ONLY valid JSON, no explanations
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        import json
        result = json.loads(result_text)
        
        if result["type"] == "existing_endpoint":
            # Use existing endpoint
            endpoint = result["endpoint"]
            params = result.get("params", {})
            
            # Map endpoint to actual function (simplified - you might want to improve this)
            # For now, we'll just return the endpoint info without executing
            return NLQueryResponse(
                query=query,
                query_type="existing_endpoint",
                endpoint=endpoint,
                params=params,
                sql=None,
                results=None  # Frontend can call the endpoint directly
            )
        
        elif result["type"] == "custom_sql":
            # Generated custom SQL
            sql = result["sql"]
            
            # Execute the SQL (with caution in production!)
            try:
                results = fetch_all(sql)
                return NLQueryResponse(
                    query=query,
                    query_type="custom_sql",
                    endpoint=None,
                    params=None,
                    sql=sql,
                    results=results
                )
            except Exception as db_error:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Database error: {str(db_error)}"
                )
        
        else:
            raise HTTPException(
                status_code=500,
                detail="LLM returned unexpected response type"
            )
    
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@router.post("/simple")
async def simple_nlquery(request: NLQueryRequest):
    """
    Simplified version that just generates SQL without checking existing endpoints.
    Useful for testing or when you always want custom queries.
    """
    
    query = request.query
    
    if not query or query.strip() == "":
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    schema_info = """Database Schema:
- Facility (facility_id, facility_name, state, region_code)
- Form (doc_ctrl_num, facility_id, year, industry_code)
- ReleaseRecord (doc_ctrl_num, medium, total_release)
- Industry (industry_code, industry_desc)

Return ONLY the SQL query, no explanations."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": schema_info},
                {"role": "user", "content": query}
            ],
            temperature=0.3,
            max_tokens=300
        )
        
        sql = response.choices[0].message.content.strip()
        sql = sql.replace('```sql', '').replace('```', '').strip()
        
        # Execute the SQL
        results = fetch_all(sql)
        
        return {
            "query": query,
            "sql": sql,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

