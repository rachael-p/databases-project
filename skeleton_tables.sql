-- drop tables if necessary
DROP TABLE IF EXISTS TransferredToPOTW;
DROP TABLE IF EXISTS POTWFacility;
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
    region_code CHAR(2) NOT NULL,
    region_desc CHAR(100),
    PRIMARY KEY (region_code)
);

CREATE TABLE Facility (
    facility_id CHAR(15) NOT NULL,
    facility_name VARCHAR(62),
    city VARCHAR(28),
    state CHAR(2),
    region_code CHAR(2),
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
    FOREIGN KEY (industry_code) REFERENCES Industry(industry_code),
);

CREATE TABLE ReleaseRecord (
    doc_ctrl_num VARCHAR(13) NOT NULL,
    medium VARCHAR(5) NOT NULL,
    total_release INT NOT NULL,
    PRIMARY KEY (doc_ctrl_num, medium),
    FOREIGN KEY (doc_ctrl_num) REFERENCES Form(doc_ctrl_num),
    CHECK (total_release >= 0),
    CHECK (medium IN ('AIR', 'WATER', 'LAND'))
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
    activity_num INT NOT NULL,
    src_red_code CHAR(3) NOT NULL,
    est_annual_red_code CHAR(2) NOT NULL,
    PRIMARY KEY (doc_ctrl_num, activity_num),
    FOREIGN KEY (doc_ctrl_num) REFERENCES Form(doc_ctrl_num),
    FOREIGN KEY (src_red_code) REFERENCES SourceReductionActivity(src_red_code),
    FOREIGN KEY (est_annual_red_code) REFERENCES EstimatedAnnualReduction(est_annual_red_code)
);

CREATE TABLE POTWFacility (
    potw_id VARCHAR(12) NOT NULL,
    potw_name VARCHAR(62),
    potw_city VARCHAR(28),
    potw_state CHAR(2),
    PRIMARY KEY (potw_id)
);

CREATE TABLE TransferredToPOTW (
    doc_ctrl_num VARCHAR(13) NOT NULL,
    potw_id VARCHAR(12) NOT NULL,
    potw_num INT NOT NULL,
    transfer_amt INT NOT NULL,
    PRIMARY KEY (doc_ctrl_num, potw_num),
    FOREIGN KEY (doc_ctrl_num) REFERENCES Form(doc_ctrl_num),
    FOREIGN KEY (potw_id) REFERENCES POTWFacility(potw_id),
    CHECK (transfer_amt >= 0)
);
