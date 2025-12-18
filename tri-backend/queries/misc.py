"""SQL used by misc endpoints."""

TOTAL_PER_REGION = """
SELECT 
  f.region_code,
  SUM(rr.total_release) AS total_release
FROM ReleaseRecord rr, Form form, Facility f
WHERE rr.doc_ctrl_num = form.doc_ctrl_num
  AND form.facility_id = f.facility_id
  AND form.year = :year
GROUP BY f.region_code
ORDER BY total_release DESC;
"""

TOP_CITIES_AIR_RELEASES = """
SELECT 
  f.city,
  f.state,
  MIN(form.year) AS start_year,
  MAX(form.year) AS end_year,
  SUM(rr.total_release) AS total_air_release
FROM ReleaseRecord rr, Form form, Facility f
WHERE rr.doc_ctrl_num = form.doc_ctrl_num
  AND form.facility_id = f.facility_id
  AND rr.medium = 'air'
  AND form.year BETWEEN :start_year AND :end_year
GROUP BY f.city, f.state
ORDER BY total_release DESC
LIMIT :limit;
"""

TOP_INDUSTRY_PER_REGION = """
WITH industry_release AS (
  SELECT 
    f.region_code,
    form.industry_code,
    SUM(rr.total_release) AS total_release
  FROM ReleaseRecord rr, Form form, Facility f
  WHERE rr.doc_ctrl_num = form.doc_ctrl_num
    AND form.facility_id = f.facility_id
    AND form.year = :year
  GROUP BY f.region_code, form.industry_code
)
SELECT 
  ir.region_code,
  i.industry_desc,
  ir.total_release
FROM industry_release ir, Industry i
WHERE i.industry_code = ir.industry_code
  AND ir.total_release = (
  SELECT MAX(total_release)
  FROM industry_release sub
  WHERE sub.region_code = ir.region_code
)
ORDER BY ir.total_release DESC;
"""

AVG_RELEASES_PRESIDENCY = """
SELECT 
  p.president_name,
  p.party,
  p.term_start,
  p.term_end,
  AVG(rr.total_release) AS avg_release
FROM President p, Form form, ReleaseRecord rr
WHERE form.year BETWEEN p.term_start AND p.term_end
  AND rr.doc_ctrl_num = form.doc_ctrl_num
GROUP BY p.president_name, p.party, p.term_start, p.term_end
HAVING COUNT(*) > 0
ORDER BY p.term_start;
"""
