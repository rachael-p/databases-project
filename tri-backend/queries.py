# place to store SQL queries
# uses parameterized queries for safety 

TOP_FACILITIES_BY_RELEASES = """
SELECT
  f.facility_id,
  f.facility_name,
  f.state,
  SUM(r.total_release) AS total_release
FROM tri_facility f
JOIN tri_release r ON r.facility_id = f.facility_id
WHERE r.year = :year
  AND (:state IS NULL OR f.state = :state)
GROUP BY f.facility_id, f.facility_name, f.state
ORDER BY total_release DESC
LIMIT :limit;
"""