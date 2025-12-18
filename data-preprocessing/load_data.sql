-- ===============================
-- Bulk load CSVs (client-side)
-- Run mysql with: mysql --local-infile=1 -h dbase.cs.jhu.edu -u FA25_rpei2 -p FA25_rpei2_db < load_data.sql
-- ===============================

-- drop tables if necessary
DROP TABLE IF EXISTS ImplementsSourceReduction;
DROP TABLE IF EXISTS SourceReductionActivity;
DROP TABLE IF EXISTS EstimatedAnnualReduction;
DROP TABLE IF EXISTS ReleaseRecord;
DROP TABLE IF EXISTS Form;
DROP TABLE IF EXISTS Industry;
DROP TABLE IF EXISTS MaxAmountChem;
DROP TABLE IF EXISTS Chemical;
DROP TABLE IF EXISTS Facility;
DROP TABLE IF EXISTS EPARegion;

-- create tables
CREATE TABLE EPARegion (
    region_code VARCHAR(2) NOT NULL,
    region_desc VARCHAR(100),
    PRIMARY KEY (region_code)
);

CREATE TABLE Facility (
    facility_id CHAR(15) NOT NULL,
    facility_name VARCHAR(62),
    city VARCHAR(28),
    state CHAR(2),
    region_code VARCHAR(2),
    email VARCHAR(100),
    PRIMARY KEY (facility_id),
    FOREIGN KEY (region_code) REFERENCES EPARegion(region_code)
);

CREATE TABLE Chemical (
    cas_reg_num VARCHAR(12) NOT NULL,
    chem_name VARCHAR(70),
    carcinogen BOOLEAN,
    pfas BOOLEAN,
    metal BOOLEAN,
    PRIMARY KEY (cas_reg_num)
);

CREATE TABLE MaxAmountChem (
    max_amt_code CHAR(2) NOT NULL,
    max_amt_desc VARCHAR(200),
    PRIMARY KEY (max_amt_code)
);

CREATE TABLE Industry (
    industry_code INT NOT NULL,
    industry_desc VARCHAR(200),
    PRIMARY KEY (industry_code)
);

CREATE TABLE Form (
    doc_ctrl_num VARCHAR(13) NOT NULL,
    facility_id CHAR(15) NOT NULL,
    cas_reg_num VARCHAR(12) NOT NULL,
    year INT,
    max_amt_code CHAR(2),
    produces BOOLEAN,
    imports BOOLEAN,
    sale_dist BOOLEAN,
    byproduct BOOLEAN,
    process_impurity BOOLEAN,
    industry_code INT,
    PRIMARY KEY (doc_ctrl_num),
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id),
    FOREIGN KEY (cas_reg_num) REFERENCES Chemical(cas_reg_num),
    FOREIGN KEY (max_amt_code) REFERENCES MaxAmountChem(max_amt_code),
    FOREIGN KEY (industry_code) REFERENCES Industry(industry_code)
);

CREATE TABLE ReleaseRecord (
    doc_ctrl_num VARCHAR(13) NOT NULL,
    total_release INT NOT NULL,
    medium VARCHAR(5) NOT NULL,
    PRIMARY KEY (doc_ctrl_num, medium),
    FOREIGN KEY (doc_ctrl_num) REFERENCES Form(doc_ctrl_num),
    CHECK (total_release >= 0)
);

CREATE TABLE SourceReductionActivity (
    src_red_code CHAR(3) NOT NULL,
    src_red_desc VARCHAR(200) NOT NULL,
    PRIMARY KEY (src_red_code)
);

CREATE TABLE EstimatedAnnualReduction (
    est_annual_red_code CHAR(2) NOT NULL,
    est_annual_desc VARCHAR(200) NOT NULL,
    PRIMARY KEY (est_annual_red_code)
);

CREATE TABLE ImplementsSourceReduction (
    doc_ctrl_num VARCHAR(13) NOT NULL,
    src_red_code CHAR(3) NOT NULL,
    est_annual_red_code CHAR(2) NOT NULL,
    activity_num INT NOT NULL,
    PRIMARY KEY (doc_ctrl_num, activity_num),
    FOREIGN KEY (doc_ctrl_num) REFERENCES Form(doc_ctrl_num),
    FOREIGN KEY (src_red_code) REFERENCES SourceReductionActivity(src_red_code),
    FOREIGN KEY (est_annual_red_code) REFERENCES EstimatedAnnualReduction(est_annual_red_code)
);

CREATE TABLE President(
    president_name VARCHAR(100) NOT NULL,
    term_start YEAR NOT NULL,
    term_end YEAR NOT NULL,
    party VARCHAR(20) NOT NULL,
    PRIMARY KEY (president_name, term_start)
)


-- (Optional) clear tables before reloading
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE ImplementsSourceReduction;
TRUNCATE TABLE ReleaseRecord;
TRUNCATE TABLE Form;
TRUNCATE TABLE Facility;
TRUNCATE TABLE Chemical;
TRUNCATE TABLE MaxAmountChem;
TRUNCATE TABLE Industry;
TRUNCATE TABLE EPARegion;
TRUNCATE TABLE SourceReductionActivity;
TRUNCATE TABLE EstimatedAnnualReduction;
SET FOREIGN_KEY_CHECKS=1;

-- -------------------------------
-- 1) EPARegion
-- CSV columns: region_code, region_description
-- DB columns: region_code, region_desc
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/epa_region_df.csv'
INTO TABLE EPARegion
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@region_code, @region_description)
SET
  region_code = NULLIF(@region_code,'\\N'),
  region_desc = NULLIF(@region_description,'\\N');

-- -------------------------------
-- 2) Industry
-- CSV columns: industry_code, industry_sector_code_description
-- DB columns: industry_code, industry_desc
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/industry_df.csv'
INTO TABLE Industry
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@industry_code, @industry_description)
SET
  industry_code = NULLIF(@industry_code,'\\N'),
  industry_desc = NULLIF(@industry_description,'\\N');

-- -------------------------------
-- 3) MaxAmountChem
-- CSV columns: maximum_amount_of_chemical_code, code_expansion
-- DB columns: max_amt_code, max_amt_desc
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/max_amount_df.csv'
INTO TABLE MaxAmountChem
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@max_amount_code, @max_amount_desc)
SET
  max_amt_code = NULLIF(@max_amount_code,'\\N'),
  max_amt_desc = NULLIF(@max_amount_desc,'\\N');

-- -------------------------------
-- 4) Facility
-- CSV columns: tri_facility_id, facility_name, city_name, state_abbr, region_code, public_email
-- DB columns: facility_id, facility_name, city, state, region_code, email
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/facility_df.csv'
INTO TABLE Facility
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@tri_facility_id, @facility_name, @city_name, @state_abbr, @region_code, @public_email)
SET
  facility_id   = NULLIF(@tri_facility_id,'\\N'),
  facility_name = NULLIF(@facility_name,'\\N'),
  city          = NULLIF(@city_name,'\\N'),
  state         = NULLIF(@state_abbr,'\\N'),
  region_code   = NULLIF(@region_code,'\\N'),
  email         = NULLIF(@public_email,'\\N');

-- -------------------------------
-- 5) Chemical
-- CSV columns: cas_registry_number, cas_chem_name, carc_ind, pfas_ind, metal_ind
-- DB columns: cas_reg_num, chem_name, carcinogen, pfas, metal
-- NOTE: carc_ind/pfas_ind/metal_ind should be 0/1/NULL in the CSV
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/chemical_df.csv'
INTO TABLE Chemical
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@cas_registry_number, @cas_chem_name, @carc_ind, @pfas_ind, @metal_ind)
SET
  cas_reg_num = NULLIF(@cas_registry_number,'\\N'),
  chem_name   = NULLIF(@cas_chem_name,'\\N'),
  carcinogen  = NULLIF(@carc_ind,'\\N'),
  pfas        = NULLIF(@pfas_ind,'\\N'),
  metal       = NULLIF(@metal_ind,'\\N');

-- -------------------------------
-- 6) SourceReductionActivity (lookup)
-- CSV columns: src_red_code, src_red_desc
-- DB columns: src_red_code, src_red_desc
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/source_reduction_activity_df.csv'
INTO TABLE SourceReductionActivity
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@src_red_code, @src_red_desc)
SET
  src_red_code = NULLIF(@src_red_code,'\\N'),
  src_red_desc = NULLIF(@src_red_desc,'\\N');

-- -------------------------------
-- 7) EstimatedAnnualReduction (lookup)
-- CSV columns: est_annual_red_code, est_annual_desc
-- DB columns: est_annual_red_code, est_annual_desc
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/estimated_annual_reduction_df.csv'
INTO TABLE EstimatedAnnualReduction
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@est_annual_red_code, @est_annual_desc)
SET
  est_annual_red_code = NULLIF(@est_annual_red_code,'\\N'),
  est_annual_desc     = NULLIF(@est_annual_desc,'\\N');

-- -------------------------------
-- 8) Form
-- CSV columns:
--   document_control_number, tri_facility_id, cas_registry_number, reporting_year,
--   maximum_amount_of_chemical_code, produce, imported, sale_distribution, byproduct, process_impurity,
--   industry_code
-- DB columns:
--   doc_ctrl_num, facility_id, cas_reg_num, year, max_amt_code,
--   produces, imports, sale_dist, byproduct, process_impurity, industry_code
-- NOTE: boolean fields should be 0/1/NULL in the CSV
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/form_df.csv'
INTO TABLE Form
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@doc_ctrl_num, @tri_facility_id, @cas_registry_number, @reporting_year, @max_amount_code, @produce, @imported, @sale_distribution, @byproduct, @process_impurity, @industry_code)
SET
  doc_ctrl_num      = NULLIF(@doc_ctrl_num,'\\N'),
  facility_id       = NULLIF(@tri_facility_id,'\\N'),
  cas_reg_num       = NULLIF(@cas_registry_number,'\\N'),
  year              = NULLIF(@reporting_year,'\\N'),
  max_amt_code      = NULLIF(@max_amount_code,'\\N'),
  produces          = NULLIF(@produce,'\\N'),
  imports           = NULLIF(@imported,'\\N'),
  sale_dist         = NULLIF(@sale_distribution,'\\N'),
  byproduct         = NULLIF(@byproduct,'\\N'),
  process_impurity  = NULLIF(@process_impurity,'\\N'),
  industry_code     = NULLIF(@industry_code,'\\N');

-- -------------------------------
-- 9) ReleaseRecord
-- CSV columns: document_control_number, total_release, medium
-- DB columns: doc_ctrl_num, total_release, medium
-- NOTE: medium must be AIR/WATER/LAND (uppercase) to match your CHECK intent
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/release_record_df.csv'
INTO TABLE ReleaseRecord
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@document_control_number, @total_release, @medium)
SET
  doc_ctrl_num  = NULLIF(@document_control_number,'\\N'),
  total_release = NULLIF(@total_release,'\\N'),
  medium        = NULLIF(@medium,'\\N');

-- -------------------------------
-- 10) ImplementsSourceReduction
-- CSV columns: document_control_number, source_reduction_activity_code, estimated_annual_reduction_code, activity_number
-- DB columns: doc_ctrl_num, activity_num, src_red_code, est_annual_red_code
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/implements_sr_df.csv'
INTO TABLE ImplementsSourceReduction
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@document_control_number, @source_reduction_activity_code, @estimated_annual_reduction_code, @activity_number)
SET
  doc_ctrl_num         = NULLIF(@document_control_number,'\\N'),
  src_red_code         = NULLIF(@source_reduction_activity_code,'\\N'),
  est_annual_red_code  = NULLIF(@estimated_annual_reduction_code,'\\N'),
  activity_num         = NULLIF(@activity_number,'\\N');

-- -------------------------------
-- 11) President
-- -------------------------------
LOAD DATA LOCAL INFILE '/home/rpei2/databases/project/cleaned_data/president.csv'
INTO TABLE President
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@president_name, @term_start, @term_end, @party)
SET
  president_name = NULLIF(@president_name,'\\N'),
  term_start     = NULLIF(@term_start,'\\N'),
  term_end       = NULLIF(@term_end,'\\N'),
  party          = NULLIF(@party,'\\N');