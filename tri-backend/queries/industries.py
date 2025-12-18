"""SQL used by industry endpoints."""

GET_ALL_INDUSTRIES = """
SELECT 
  i.industry_desc,
  i.industry_code
FROM Industry i;
"""

RELEASES_BY_INDUSTRY = """
SELECT
  i.industry_desc,
  SUM(r.total_release) AS total_release,
  i.industry_code
FROM Facility f, Form fo, ReleaseRecord r, Industry i
WHERE f.facility_id = fo.facility_id
  AND fo.doc_ctrl_num = r.doc_ctrl_num
  AND fo.industry_code = i.industry_code
  AND fo.year = :year
GROUP BY i.industry_code, i.industry_desc
ORDER BY total_release DESC;
"""

RELEASES_PER_MEDIUM = """
SELECT 
  i.industry_desc,
  r.medium,
  SUM(r.total_release) AS total_release,
  fo.year
FROM Facility f, Form fo, ReleaseRecord r, Industry i
WHERE f.facility_id = fo.facility_id
  AND fo.doc_ctrl_num = r.doc_ctrl_num
  AND fo.industry_code = :industry
  AND fo.year = :year
GROUP BY i.industry_desc, r.medium, fo.year;
"""