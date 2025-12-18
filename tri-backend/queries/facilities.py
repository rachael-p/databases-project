"""SQL used by facilities endpoints."""

GET_ALL_FACILITIES = """
SELECT 
  f.facility_name,
  f.facility_id
FROM Facility f;
"""

TOP_N_FACILITIES_BY_RELEASES = """
SELECT
  f.facility_id,
  f.facility_name,
  f.state,
  f.region_code,
  i.industry_desc,
  SUM(rr.total_release) AS total_release
FROM Facility f, Form form, ReleaseRecord rr, Industry i
WHERE form.year = :year
  AND f.facility_id = form.facility_id
  AND form.doc_ctrl_num = rr.doc_ctrl_num
  AND i.industry_code = form.industry_code
  AND (:state IS NULL OR f.state = :state)
  AND (:region IS NULL OR f.region_code = :region)
  AND (:industry IS NULL OR form.industry_code = :industry)
GROUP BY f.facility_id, f.facility_name, f.state, f.region_code, i.industry_desc
ORDER BY total_release DESC
LIMIT :limit;
"""

RELEASES_BY_MEDIUM = """
SELECT 
  f.facility_name,
  r.medium,
  SUM(r.total_release) AS total_release
FROM Facility f, Form fo, ReleaseRecord r
WHERE f.facility_id = fo.facility_id 
  AND fo.doc_ctrl_num = r.doc_ctrl_num 
  AND f.facility_id = :facility_id
  AND fo.year = :year
GROUP BY f.facility_name, r.medium;
"""
