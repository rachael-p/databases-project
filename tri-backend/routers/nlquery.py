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

@router.post("/", response_model=NLQueryResponse)
async def natural_language_query(request: NLQueryRequest):
    """
    Process a natural language query about EPA TRI data.
    Generate custom SQL directly (frontend handles endpoint mapping).
    """
    
    query = request.query
    
    if not query or query.strip() == "":
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    system_prompt = """You are a SQL generator for the TRI database. Return ONLY JSON:
{"type": "custom_sql", "sql": "<SQL here>"}
Use this schema:
- Facility (facility_id, facility_name, state, region_code)
- Form (doc_ctrl_num, facility_id, year, industry_code)
- ReleaseRecord (doc_ctrl_num, medium, total_release)
- Industry (industry_code, industry_desc)

Rules:
- Use 2-letter state codes.
- Use 4-digit years.
- Never reference API endpoints.
- Return only the JSON object, no explanations."""

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
        
        sql = result.get("sql")
        if not sql:
            raise HTTPException(status_code=500, detail="LLM did not return SQL")

        try:
            results = fetch_all(sql, {})
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
