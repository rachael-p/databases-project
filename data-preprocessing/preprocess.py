import pandas as pd
import numpy as np
import os

SRC_RED_ACT = {
    "S01": "Substituted a fuel",
    "S02": "Substituted an organic solvent",
    "S03": "Substituted raw materials, feedstock, or reactant chemical",
    "S04": "Substituted manufacturing aid, processing aid, or other ancillary chemical",
    "S05": "Modified content, grade, or purity of a chemical input",
    "S06": "Other material modifications made",

    "S11": "Reformulated or developed new product line",
    "S12": "Altered dimensions, components, or final design of product",
    "S13": "Modified product packaging",
    "S14": "Other product modifications made",

    "S21": "Optimized process conditions to increase efficiency",
    "S22": "Instituted recirculation within a process",
    "S23": "Implemented new technology, technique, or process",
    "S24": "Modified or updated equipment or layout",
    "S25": "Other process modifications made",

    "S31": "Instituted better labeling, testing, or other inventory management practices",
    "S32": "Changed size or type of containers procured",
    "S33": "Improved containment or material handling operations",
    "S34": "Improved monitoring practices of potential spill or leak sources",
    "S35": "Other improvements to inventory and material management",

    "S41": "Improved scheduling, record keeping, or procedures for operations, cleaning, and maintenance",
    "S42": "Changed production schedule to minimize equipment and material changeovers",
    "S43": "Introduced in-line product quality monitoring or other process analysis system",
    "S44": "Other improvements to operating practices or operator training"
}

EST_ANNUAL_RED = {
    "R1": "100% (elimination of the chemical)",
    "R2": "Greater than or equal to 50%, but less than 100%",
    "R3": "Greater than or equal to 25%, but less than 50%",
    "R4": "Greater than or equal to 15%, but less than 25%",
    "R5": "Greater than or equal to 5%, but less than 15%",
    "R6": "Greater than 0%, but less than 5%"
}

# Normalize booleans (TRI often uses 'Y'/'N' or '1'/'0')
def to_bool(x):
    if pd.isna(x): return pd.NA
    s = str(x).strip().upper()
    if s in {"Y","YES","1","TRUE","T"}: return 1
    if s in {"N","NO","0","FALSE","F"}: return 0
    return pd.NA

# build static lookup csvs
def build_source_reduction_lookups(
    src_red_dict: dict,
    est_annual_dict: dict
):
    # SourceReductionActivity table
    source_reduction_activity_df = (
        pd.DataFrame(
            src_red_dict.items(),
            columns=["src_red_code", "src_red_desc"]
        )
        .sort_values("src_red_code")
        .reset_index(drop=True)
    )

    # EstimatedAnnualReduction table
    estimated_annual_reduction_df = (
        pd.DataFrame(
            est_annual_dict.items(),
            columns=["est_annual_red_code", "est_annual_desc"]
        )
        .sort_values("est_annual_red_code")
        .reset_index(drop=True)
    )

    return source_reduction_activity_df, estimated_annual_reduction_df


def build_presidents() -> pd.DataFrame:
    """Small lookup for U.S. presidents covering the TRI data years."""
    data = [
        ("Bill Clinton", 1993, 2000, "Democrat"),
        ("George W. Bush", 2001, 2008, "Republican"),
        ("Barack Obama", 2009, 2016, "Democrat"),
        ("Donald Trump", 2017, 2020, "Republican"),
        ("Joe Biden", 2021, 2024, "Democrat"),
        ("Donald Trump", 2025, 2029, "Republican"),
    ]
    return pd.DataFrame(
        data,
        columns=["president_name", "term_start", "term_end", "party"],
    )

# -----------------------------
# 1) Read + standardize columns
# -----------------------------
def load_and_clean(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path, dtype=str)  # read everything as string first (safer)
    df.columns = df.columns.str.strip()

    # Rename to simple names you’ll use everywhere
    rename = {
        "V_TRI_FORM_R_EZ.TRI_FACILITY_ID": "tri_facility_id",
        "V_TRI_FORM_R_EZ.FACILITY_NAME": "facility_name",
        "V_TRI_FORM_R_EZ.CITY_NAME": "city_name",
        "V_TRI_FORM_R_EZ.STATE_ABBR": "state_abbr",
        "V_TRI_FORM_R_EZ.ZIP_CODE": "zip_code",
        "V_TRI_FORM_R_EZ.REGION": "region_code",
        "V_TRI_FORM_R_EZ.ASGN_PUBLIC_CONTACT_EMAIL": "public_email",

        "V_TRI_FORM_R_EZ.DOC_CTRL_NUM": "doc_ctrl_num",
        "V_TRI_FORM_R_EZ.CAS_REGISTRY_NUMBER": "cas_registry_number",
        "V_TRI_FORM_R_EZ.REPORTING_YEAR": "reporting_year",
        "V_TRI_FORM_R_EZ.MAX_AMOUNT_OF_CHEM": "max_amount_code",
        "Code Expansion for Maximum Amount Of Chemical": "max_amount_desc",

        "V_TRI_FORM_R_EZ.CAS_CHEM_NAME": "cas_chem_name",
        "V_TRI_FORM_R_EZ.CARC_IND": "carc_ind",
        "V_TRI_FORM_R_EZ.PFAS_IND": "pfas_ind",
        "V_TRI_FORM_R_EZ.METAL_IND": "metal_ind",

        "V_TRI_FORM_R_EZ.PRODUCE": "produce",
        "V_TRI_FORM_R_EZ.IMPORTED": "imported",
        "V_TRI_FORM_R_EZ.SALE_DISTRIBUTION": "sale_distribution",
        "V_TRI_FORM_R_EZ.BYPRODUCT": "byproduct",
        "V_TRI_FORM_R_EZ.PROCESS_IMPURITY": "process_impurity",

        "V_TRI_FORM_R_EZ.AIR_TOTAL_RELEASE": "air_total_release",
        "V_TRI_FORM_R_EZ.WATER_TOTAL_RELEASE": "water_total_release",
        "V_TRI_FORM_R_EZ.LAND_TOTAL_RELEASE": "land_total_release",

        "V_TRI_FORM_R_EZ.SOURCE_REDUCTION_IND": "source_reduction_ind",
        "V_TRI_FORM_R_EZ.SOURCE_REDUCTION_ACT_1": "sr_act_1",
        "V_TRI_FORM_R_EZ.EST_ANNUAL_REDUCT_1": "ear_1",
        "V_TRI_FORM_R_EZ.SOURCE_REDUCTION_ACT_2": "sr_act_2",
        "V_TRI_FORM_R_EZ.EST_ANNUAL_REDUCT_2": "ear_2",
        "V_TRI_FORM_R_EZ.SOURCE_REDUCTION_ACT_3": "sr_act_3",
        "V_TRI_FORM_R_EZ.EST_ANNUAL_REDUCT_3": "ear_3",

        "V_TRI_FORM_R_EZ.INDUSTRY_CODE": "industry_code",
        "V_TRI_FORM_R_EZ.INDUSTRY_DESCRIPTION": "industry_description",
    }
    df = df.rename(columns=rename)

    # Trim common string fields
    str_cols = [
        "tri_facility_id","facility_name","city_name","state_abbr","zip_code",
        "region_code","public_email","doc_ctrl_num","cas_registry_number",
        "max_amount_code","max_amount_desc","cas_chem_name","industry_code",
        "industry_description","sr_act_1","sr_act_2","sr_act_3","ear_1","ear_2","ear_3"
    ]
    for c in str_cols:
        if c in df.columns:
            df[c] = df[c].astype(str).str.strip()
            df.loc[df[c].isin(["", "nan", "None"]), c] = np.nan

    # Datatypes: year + numeric releases
    df["reporting_year"] = pd.to_numeric(df["reporting_year"], errors="coerce").astype("Int64")

    for c in ["air_total_release", "water_total_release", "land_total_release"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")  # keep as float; cast to int later if you want

    bool_cols = ["carc_ind","pfas_ind","metal_ind",
                 "produce","imported","sale_distribution","byproduct","process_impurity",
                 "source_reduction_ind"]
    for c in bool_cols:
        df[c] = df[c].apply(to_bool)

    return df


# ---------------------------------------
# 2) Build normalized "table" dataframes
# ---------------------------------------
def build_tables(df: pd.DataFrame):
    # Facility
    facility_df = (
        df[["tri_facility_id","facility_name","city_name","state_abbr","region_code","public_email"]]
        .drop_duplicates(subset=["tri_facility_id"])
        .reset_index(drop=True)
    )

    # EPA Region (code -> description)
    REGION_DESC = {
        "1": "Region 1 — New England",
        "2": "Region 2 — New York & New Jersey",
        "3": "Region 3 — Mid-Atlantic",
        "4": "Region 4 — Southeast",
        "5": "Region 5 — Great Lakes",
        "6": "Region 6 — South Central",
        "7": "Region 7 — Central",
        "8": "Region 8 — Mountains & Plains",
        "9": "Region 9 — Pacific Southwest",
        "10": "Region 10 — Pacific Northwest",
    }
    epa_region_df = (
        df[["region_code"]]
        .dropna()
        .drop_duplicates()
        .assign(
            region_code=lambda x: x["region_code"].astype(str).str.zfill(2),
            region_description=lambda x: x["region_code"].map(REGION_DESC)
        )
        .reset_index(drop=True)
    )

    # Chemical
    chemical_df = (
        df[["cas_registry_number","cas_chem_name","carc_ind","pfas_ind","metal_ind"]]
        .drop_duplicates(subset=["cas_registry_number"])
        .reset_index(drop=True)
    )

    # MaxAmountChem
    max_amount_df = (
        df[["max_amount_code","max_amount_desc"]]
        .dropna(subset=["max_amount_code"])
        .drop_duplicates(subset=["max_amount_code"])
        .reset_index(drop=True)
    )

    # Industry
    industry_df = (
        df[["industry_code","industry_description"]]
        .dropna(subset=["industry_code"])
        .drop_duplicates(subset=["industry_code"])
        .reset_index(drop=True)
    )
    industry_df["industry_code"] = pd.to_numeric(industry_df["industry_code"], errors="coerce").astype("Int64")

    # Form (one per DCN)
    form_df = (
        df[[
            "doc_ctrl_num","tri_facility_id","cas_registry_number","reporting_year",
            "max_amount_code","produce","imported","sale_distribution","byproduct","process_impurity",
            "industry_code"
        ]]
        .drop_duplicates(subset=["doc_ctrl_num"])
        .reset_index(drop=True)
    )
    form_df["industry_code"] = pd.to_numeric(form_df["industry_code"], errors="coerce").astype("Int64")

    # ReleaseRecord: wide -> long with Medium
    release_map = {
        "air_total_release": "air",
        "water_total_release": "water",
        "land_total_release": "land",
    }
    release_record_df = (
        df[["doc_ctrl_num", *release_map.keys()]]
        .rename(columns={"doc_ctrl_num":"document_control_number"})
        .melt(
            id_vars=["document_control_number"],
            value_vars=list(release_map.keys()),
            var_name="medium_raw",
            value_name="total_release"
        )
    )
    release_record_df["medium"] = release_record_df["medium_raw"].map(release_map)
    release_record_df = release_record_df.drop(columns=["medium_raw"])
    release_record_df = release_record_df.dropna(subset=["total_release"])
    # Optional: drop zeros if you want
    # release_record_df = release_record_df[release_record_df["total_release"] != 0]
    # If your schema wants INTEGER pounds:
    release_record_df["total_release"] = release_record_df["total_release"].round().astype("Int64")


    # ImplementsSourceReduction: 3 slots -> long rows
    slots = [(1, "sr_act_1", "ear_1"), (2, "sr_act_2", "ear_2"), (3, "sr_act_3", "ear_3")]
    sr_rows = []
    for n, act_col, ear_col in slots:
        tmp = df[["doc_ctrl_num", act_col, ear_col]].copy()
        tmp = tmp.rename(columns={
            "doc_ctrl_num":"document_control_number",
            act_col:"source_reduction_activity_code",
            ear_col:"estimated_annual_reduction_code",
        })
        tmp["activity_number"] = n
        sr_rows.append(tmp)

    implements_sr_df = pd.concat(sr_rows, ignore_index=True)
    implements_sr_df = implements_sr_df.dropna(subset=["source_reduction_activity_code"])
    implements_sr_df["source_reduction_activity_code"] = implements_sr_df["source_reduction_activity_code"].astype(str).str.strip()
    implements_sr_df["estimated_annual_reduction_code"] = implements_sr_df["estimated_annual_reduction_code"].astype(str).str.strip()
    implements_sr_df.loc[implements_sr_df["estimated_annual_reduction_code"].isin(["", "nan", "None"]), "estimated_annual_reduction_code"] = pd.NA

    return {
        "facility_df": facility_df,
        "epa_region_df": epa_region_df,
        "chemical_df": chemical_df,
        "max_amount_df": max_amount_df,
        "industry_df": industry_df,
        "form_df": form_df,
        "release_record_df": release_record_df,
        "implements_sr_df": implements_sr_df,
        "president_df": build_presidents(),
    }


# -----------------------------
# Usage
# -----------------------------
df = load_and_clean("data-preprocessing/raw_epa_data.csv")
tables = build_tables(df)
src_red_df, est_ann_red_df = build_source_reduction_lookups(SRC_RED_ACT,EST_ANNUAL_RED)
tables["source_reduction_activity_df"] = src_red_df
tables["estimated_annual_reduction_df"] = est_ann_red_df
for k in tables.keys():
    print(tables[k].head())

out_dir = "cleaned_data"
os.makedirs(out_dir, exist_ok=True)

def dump(df, name):
    path = os.path.join(out_dir, f"{name}.csv")
    df.to_csv(path, index=False, na_rep="\\N")  # \N becomes NULL in LOAD DATA
    return path

paths = {name: dump(tables[name], name) for name in tables.keys()}
paths
