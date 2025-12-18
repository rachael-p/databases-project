"""SQL used by facilities endpoints."""

GET_ALL_CHEMICALS = """
SELECT 
  c.chem_name,
  c.cas_reg_num
FROM Chemical c;
"""

TOP_N_CHEMICALS = """
SELECT 
  c.chem_name,
  c.cas_reg_num,
  SUM(r.total_release) AS total_release,
  c.carcinogen,
  c.pfas,
  c.metal
FROM Chemical c, Form f, ReleaseRecord r
WHERE c.cas_reg_num = f.cas_reg_num 
  AND f.doc_ctrl_num = r.doc_ctrl_num
  AND f.year = :year
GROUP BY c.chem_name, c.cas_reg_num, c.carcinogen, c.pfas, c.metal
ORDER BY total_release DESC
LIMIT :limit;
"""

TOP_N_CARCINOGENS = """
SELECT 
  c.chem_name,
  c.cas_reg_num,
  SUM(r.total_release) AS total_release
FROM Chemical c, Form f, ReleaseRecord r
WHERE c.cas_reg_num = f.cas_reg_num 
  AND f.doc_ctrl_num = r.doc_ctrl_num
  AND f.year = :year
  AND c.carcinogen = 1
GROUP BY c.chem_name, c.cas_reg_num
ORDER BY total_release DESC
LIMIT :limit;
"""

RELEASES_OVER_TIME = """
SELECT 
  c.chem_name,
  SUM(r.total_release) AS total_release,
  fo.year
FROM Chemical c, Form fo, Facility f, ReleaseRecord r
WHERE c.cas_reg_num = :chem_id
  AND c.cas_reg_num = fo.cas_reg_num 
  AND fo.doc_ctrl_num = r.doc_ctrl_num
  AND fo.facility_id = f.facility_id
  AND fo.year BETWEEN :start_year AND :end_year
  AND (:city IS NULL OR f.city = :city)
  AND (:state IS NULL OR f.state = :state)
  AND (:region IS NULL OR f.region_code = :region)
GROUP BY c.chem_name, c.cas_reg_num, fo.year
ORDER BY fo.year, total_release DESC;
"""

TOP_STATES_BY_TOTAL_RELEASES = """
SELECT 
  f.state,
  SUM(r.total_release) AS total_release
FROM Chemical c, Form fo, Facility f, ReleaseRecord r
WHERE c.cas_reg_num = :chem_id
  AND c.cas_reg_num = fo.cas_reg_num 
  AND fo.doc_ctrl_num = r.doc_ctrl_num
  AND fo.year = :year
GROUP BY f.state
ORDER BY total_release DESC
LIMIT :limit;
"""

AVG_CARCINOGENS_PER_REGION = """
SELECT
  f.region_code,
  AVG(pfas_releases.pfas_total) AS avg_pfas_total
FROM Facility f, (
  SELECT 
    f.region_code,
    SUM(r.total_release) AS pfas_total
  FROM Chemical c, Form fo, ReleaseRecord r, Facility f
  WHERE c.carcinogen = 1
    AND c.cas_reg_num = fo.cas_reg_num 
    AND fo.doc_ctrl_num = r.doc_ctrl_num
    AND fo.facility_id = f.facility_id
    AND fo.year = :year
  GROUP BY f.region_code
) AS pfas_releases
WHERE f.region_code = pfas_releases.region_code
GROUP BY f.region_code;
"""

NUM_FACILITIES_STATES_CITIES_OVER_TIME = """
SELECT 
  fo.year,
  COUNT(DISTINCT fo.facility_id) AS num_facilities,
  COUNT(DISTINCT f.state) AS num_states,
  COUNT(DISTINCT f.city) AS num_cities
From Chemical c, Facility f, Form fo, ReleaseRecord r
WHERE r.total_release > 0
  AND c.cas_reg_num = :chem_id
  AND c.cas_reg_num = fo.cas_reg_num
  AND fo.doc_ctrl_num = r.doc_ctrl_num
  AND fo.facility_id = f.facility_id
GROUP BY fo.year
ORDER BY fo.year;
"""
