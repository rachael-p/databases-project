-- Q1 (Question 1):
-- For a given year and state, list all facilities and their total releases across all media.
SELECT
    f.facility_id,
    f.facility_name,
    f.city,
    f.state,
    SUM(r.total_release) AS total_release_all_media
FROM Form AS frm, Facility AS f, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022          -- change year as needed
  AND f.state = 'MD'           -- change state as needed
GROUP BY
    f.facility_id,
    f.facility_name,
    f.city,
    f.state
ORDER BY total_release_all_media DESC;

-- Q2 (Question 2):
-- For each EPA region and medium, total toxic releases in a given year.
SELECT
    e.region_code,
    e.region_desc,
    r.medium,
    SUM(r.total_release) AS total_release
FROM Form AS frm, Facility AS f, EPARegion AS e, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND f.region_code = e.region_code
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022
GROUP BY
    e.region_code,
    e.region_desc,
    r.medium
ORDER BY
    e.region_code,
    r.medium;

-- Q3 (Question 3):
-- Top 10 chemicals by total releases in a given year (all media, all facilities).
SELECT
    c.cas_reg_num,
    c.chem_name,
    SUM(r.total_release) AS total_release_all_media
FROM Form AS frm, Chemical AS c, ReleaseRecord AS r
WHERE frm.cas_reg_num = c.cas_reg_num
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022
GROUP BY
    c.cas_reg_num,
    c.chem_name
ORDER BY total_release_all_media DESC
LIMIT 10;

-- Q4 (Question 4):
-- Total carcinogen releases per state for a given year.
SELECT
    f.state,
    SUM(r.total_release) AS total_carcinogen_release
FROM Form AS frm, Facility AS f, Chemical AS c, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND frm.cas_reg_num = c.cas_reg_num
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022
  AND c.carcinogen = TRUE
GROUP BY f.state
ORDER BY total_carcinogen_release DESC;

-- Q5 (Question 5):
-- For PFAS chemicals, average annual total release per EPA region over a range of years.
SELECT
    ry.region_code,
    ry.region_desc,
    AVG(ry.yearly_total_release) AS avg_annual_pfas_release
FROM (
    SELECT
        e.region_code,
        e.region_desc,
        frm.year,
        SUM(r.total_release) AS yearly_total_release
    FROM Form AS frm, Facility AS f, EPARegion AS e, Chemical AS c, ReleaseRecord AS r
    WHERE frm.facility_id = f.facility_id
      AND f.region_code = e.region_code
      AND frm.cas_reg_num = c.cas_reg_num
      AND frm.doc_ctrl_num = r.doc_ctrl_num
      AND c.pfas = TRUE
      AND frm.year BETWEEN 2018 AND 2022      -- change year range as needed
    GROUP BY
        e.region_code,
        e.region_desc,
        frm.year
) AS ry
GROUP BY
    ry.region_code,
    ry.region_desc
ORDER BY
    avg_annual_pfas_release DESC;

-- Q6 (Question 6):
-- For a selected facility, trend of total releases by medium over multiple years.
SELECT
    frm.facility_id,
    f.facility_name,
    frm.year,
    r.medium,
    SUM(r.total_release) AS total_release
FROM Form AS frm, Facility AS f, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.facility_id = '123456789012345'   -- replace with a specific facility_id
GROUP BY
    frm.facility_id,
    f.facility_name,
    frm.year,
    r.medium
ORDER BY
    frm.year,
    r.medium;

-- Q7 (Question 7):
-- Facilities that both produce and import the same chemical in the same year.
SELECT
    frm.facility_id,
    f.facility_name,
    frm.cas_reg_num,
    c.chem_name,
    frm.year,
    SUM(r.total_release) AS total_release_all_media
FROM Form AS frm, Facility AS f, Chemical AS c, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND frm.cas_reg_num = c.cas_reg_num
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.produces = TRUE
  AND frm.imports = TRUE
  AND frm.year = 2022
GROUP BY
    frm.facility_id,
    f.facility_name,
    frm.cas_reg_num,
    c.chem_name,
    frm.year
ORDER BY total_release_all_media DESC;

-- Q8 (Question 8):
-- For each industry, total toxic release in a given year.
SELECT
    i.industry_code,
    i.industry_desc,
    SUM(r.total_release) AS total_release_all_media
FROM Form AS frm, Industry AS i, ReleaseRecord AS r
WHERE frm.industry_code = i.industry_code
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022
GROUP BY
    i.industry_code,
    i.industry_desc
ORDER BY total_release_all_media DESC;

-- Q9 (Question 9):
-- For each chemical, distinct facilities and states that reported it in a given year.
SELECT
    c.cas_reg_num,
    c.chem_name,
    COUNT(DISTINCT frm.facility_id) AS num_facilities,
    COUNT(DISTINCT f.state) AS num_states
FROM Form AS frm, Chemical AS c, Facility AS f
WHERE frm.cas_reg_num = c.cas_reg_num
  AND frm.facility_id = f.facility_id
  AND frm.year = 2022
GROUP BY
    c.cas_reg_num,
    c.chem_name
ORDER BY num_facilities DESC;

-- Q10 (Question 10):
-- For a given state and year, chemicals with the largest total releases,
-- along with flags for carcinogen, PFAS, and metal.
SELECT
    c.cas_reg_num,
    c.chem_name,
    SUM(r.total_release) AS total_release_all_media,
    c.carcinogen,
    c.pfas,
    c.metal
FROM Form AS frm, Facility AS f, Chemical AS c, ReleaseRecord AS r
WHERE frm.facility_id = f.facility_id
  AND frm.cas_reg_num = c.cas_reg_num
  AND frm.doc_ctrl_num = r.doc_ctrl_num
  AND frm.year = 2022           
  AND f.state = 'MD'             
GROUP BY
    c.cas_reg_num,
    c.chem_name,
    c.carcinogen,
    c.pfas,
    c.metal
ORDER BY
    total_release_all_media DESC
LIMIT 10;                         -- the top chemicals for that state/year

-- Q11 (Question 11):
-- Total amount transferred to each POTW in a given year, top 5 POTWs.
SELECT
    p.potw_id,
    p.potw_name,
    p.potw_city,
    p.potw_state,
    SUM(t.transfer_amt) AS total_transfer_amt
FROM TransferredToPOTW AS t, POTWFacility AS p, Form AS frm
WHERE t.potw_id = p.potw_id
  AND t.doc_ctrl_num = frm.doc_ctrl_num
  AND frm.year = 2022
GROUP BY
    p.potw_id,
    p.potw_name,
    p.potw_city,
    p.potw_state
ORDER BY total_transfer_amt DESC
LIMIT 5;

-- Q12 (Question 12):
-- For each facility and year, total transferred to POTWs vs total direct environmental releases.
SELECT
    f.facility_id,
    f.facility_name,
    frm.year,
    -- total direct releases (sum across all media)
    (SELECT SUM(r.total_release)
     FROM Form AS frm2, ReleaseRecord AS r
     WHERE frm2.facility_id = f.facility_id
       AND frm2.year = frm.year
       AND frm2.doc_ctrl_num = r.doc_ctrl_num
    ) AS total_release_all_media,
    -- total transfers to POTWs
    (SELECT SUM(t.transfer_amt)
     FROM Form AS frm3, TransferredToPOTW AS t
     WHERE frm3.facility_id = f.facility_id
       AND frm3.year = frm.year
       AND frm3.doc_ctrl_num = t.doc_ctrl_num
    ) AS total_transfer_to_potw
FROM Facility AS f, Form AS frm
WHERE frm.facility_id = f.facility_id
GROUP BY
    f.facility_id,
    f.facility_name,
    frm.year
ORDER BY
    f.facility_id,
    frm.year;

-- Q13 (Question 13):
-- Facilities that have implemented source reduction activities in a given year,
-- including activity type and estimated annual reduction codes.
SELECT
    frm.year,
    frm.facility_id,
    f.facility_name,
    isr.activity_num,
    s.src_red_code,
    s.src_red_desc,
    isr.est_annual_red_code
FROM ImplementsSourceReduction AS isr,
     SourceReductionActivity AS s,
     Form AS frm,
     Facility AS f
WHERE isr.src_red_code = s.src_red_code
  AND isr.doc_ctrl_num = frm.doc_ctrl_num
  AND frm.facility_id = f.facility_id
  AND frm.year = 2022                
ORDER BY
    frm.facility_id,
    isr.activity_num;

-- Q14 (Question 14):
-- Facilities with large releases but no source reduction activities in a given year.
WITH FacilityRelease AS (
    SELECT
        frm.doc_ctrl_num,
        frm.facility_id,
        SUM(r.total_release) AS total_release_all_media
    FROM Form AS frm, ReleaseRecord AS r
    WHERE frm.doc_ctrl_num = r.doc_ctrl_num
      AND frm.year = 2022
    GROUP BY
        frm.doc_ctrl_num,
        frm.facility_id
),
DocsWithSourceReduction AS (
    SELECT DISTINCT doc_ctrl_num
    FROM ImplementsSourceReduction
)
SELECT
    fr.facility_id,
    f.facility_name,
    f.city,
    f.state,
    SUM(fr.total_release_all_media) AS total_release_all_media
FROM FacilityRelease AS fr, Facility AS f
WHERE fr.facility_id = f.facility_id
  AND fr.doc_ctrl_num NOT IN (SELECT doc_ctrl_num FROM DocsWithSourceReduction)
GROUP BY
    fr.facility_id,
    f.facility_name,
    f.city,
    f.state
HAVING SUM(fr.total_release_all_media) > 10000   
ORDER BY total_release_all_media DESC;

-- Q15 (Question 15):
-- For a given source reduction activity code, count implementations by state.
SELECT
    s.src_red_code,
    s.src_red_desc,
    f.state,
    COUNT(*) AS num_implementations
FROM ImplementsSourceReduction AS isr, SourceReductionActivity AS s, Form AS frm, Facility AS f
WHERE isr.src_red_code = s.src_red_code
  AND isr.doc_ctrl_num = frm.doc_ctrl_num
  AND frm.facility_id = f.facility_id
  AND s.src_red_code = 'S23'     
  AND frm.year BETWEEN 2018 AND 2022
GROUP BY
    s.src_red_code,
    s.src_red_desc,
    f.state
ORDER BY num_implementations DESC;
