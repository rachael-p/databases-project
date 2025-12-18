"""SQL used by source reduction endpoints."""

GET_ALL_SRC_RED = """
SELECT 
  sr.src_red_desc,
  sr.src_red_code
FROM SourceReductionActivity sr;
"""

MOST_EFFECTIVE_STRATS = """
SELECT 
  sra.src_red_desc,
  COUNT(*) AS r1_count
FROM SourceReductionActivity sra, ImplementsSourceReduction i, EstimatedAnnualReduction e
WHERE i.est_annual_red_code = 'R1'
  AND i.src_red_code = sra.src_red_code
  AND e.est_annual_red_code = i.est_annual_red_code
GROUP BY sra.src_red_desc
ORDER BY r1_count DESC
LIMIT :limit;
"""

BEFORE_AFTER_SRC = """
SELECT 
  f.facility_name,
  c.chem_name,
  f1.year AS year_before,
  f2.year AS year_after,
  SUM(r1.total_release) AS total_release_before,
  SUM(r2.total_release) AS total_release_after,
  sra.src_red_desc
FROM Facility f, Chemical c, Form f1, Form f2, ReleaseRecord r1, ReleaseRecord r2, ImplementsSourceReduction i2, SourceReductionActivity sra
WHERE f.facility_id = f1.facility_id
  AND f.facility_id = f2.facility_id
  AND f1.cas_reg_num = c.cas_reg_num
  AND f2.cas_reg_num = c.cas_reg_num
  AND r1.doc_ctrl_num = f1.doc_ctrl_num
  AND r2.doc_ctrl_num = f2.doc_ctrl_num
  AND i2.doc_ctrl_num = f2.doc_ctrl_num
  AND f2.year = f1.year + 1
  AND r1.total_release > 0
  AND i2.src_red_code = sra.src_red_code
  AND NOT EXISTS (
    SELECT 1
    FROM ImplementsSourceReduction i1
    WHERE i1.doc_ctrl_num = f1.doc_ctrl_num) 
GROUP BY f.facility_name, c.chem_name, f1.year, f2.year
ORDER BY (SUM(r1.total_release) - SUM(r2.total_release)) DESC
LIMIT :limit;
"""

COMMON_STRAT_PER_INDUSTRY = """
WITH occurrences AS (
  SELECT 
    sra.src_red_code,
    f.industry_code,
    COUNT(i.src_red_code) AS count
  FROM SourceReductionActivity sra, ImplementsSourceReduction i, Form f
  WHERE i.src_red_code = sra.src_red_code
    AND i.doc_ctrl_num = f.doc_ctrl_num
  GROUP BY sra.src_red_code, f.industry_code
)
SELECT 
  sra.src_red_desc,
  o.industry_code,
  o.count AS occurrences
FROM SourceReductionActivity sra, occurrences o
WHERE sra.src_red_code = o.src_red_code
  AND o.count = (SELECT MAX(count) FROM occurrences WHERE industry_code = o.industry_code);
"""

TOP_CHEM_RED_PER_STATE = """
WITH occurrences AS (
  SELECT 
    f.state,
    c.chem_name,
    COUNT(*) AS count
  FROM ImplementsSourceReduction i, Form form, Facility f, Chemical c
  WHERE i.doc_ctrl_num = form.doc_ctrl_num
    AND form.facility_id = f.facility_id
    AND form.cas_reg_num = c.cas_reg_num
    AND form.year BETWEEN :start_year AND :end_year
  GROUP BY f.state, c.chem_name
)
SELECT 
  o.state,
  MIN(o.chem_name) AS chem_name,
  o.count AS occurrences
FROM occurrences o
WHERE o.count = (SELECT MAX(count) FROM occurrences WHERE state = o.state)
GROUP BY o.state
ORDER BY o.state;
"""

FACILITY_RED_VS_STRATS = """
SELECT 
  fac.facility_id,
  fac.facility_name,
  c.chem_name,
  form.year,
  i.activity_num,
  sra.src_red_desc,
  e.est_annual_desc
FROM ImplementsSourceReduction i, Form form, Facility fac, SourceReductionActivity sra, EstimatedAnnualReduction e, Chemical c
WHERE i.doc_ctrl_num = form.doc_ctrl_num
  AND fac.facility_id = form.facility_id
  AND sra.src_red_code = i.src_red_code
  AND e.est_annual_red_code = i.est_annual_red_code
  AND fac.facility_id = :facility_id
  AND form.cas_reg_num = c.cas_reg_num
  AND form.year BETWEEN :start_year AND :end_year
  AND i.activity_num BETWEEN 1 AND 3
ORDER BY i.activity_num, sra.src_red_desc;
"""

TYPICAL_EFFECTIVENESS = """
WITH occurrences AS (
  SELECT 
    sra.src_red_code,
    e.est_annual_desc,
    COUNT(e.est_annual_red_code) AS count
  FROM SourceReductionActivity sra, ImplementsSourceReduction i, EstimatedAnnualReduction e
  WHERE i.src_red_code = sra.src_red_code
    AND i.est_annual_red_code = e.est_annual_red_code
  GROUP BY sra.src_red_code, e.est_annual_red_code
)
SELECT 
  sra.src_red_desc,
  o.est_annual_desc AS typical_effectiveness
FROM SourceReductionActivity sra, occurrences o
WHERE sra.src_red_code = o.src_red_code
  AND o.count = (SELECT MAX(count) FROM occurrences WHERE src_red_code = sra.src_red_code);
"""
