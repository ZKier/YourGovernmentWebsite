from pathlib import Path
import geopandas as gpd

print("Does this work here?")

# Docker
# gpkg_path = "/data/cb_2025_us_all_5m/cb_2025_us_all_5m.gpkg"
# project_root = ""

# Windows
# gpkg_path = "public/data/cb_2025_us_all_5m/cb_2025_us_all_5m.gpkg"
gpkg_path = "public/data/cb_2025_us_all_5m.gpkg"
project_root = Path(__file__).resolve().parent.parent

# Get the layers in the file
layers = gpd.list_layers(gpkg_path)
print(layers)

gdf = gpd.read_file(gpkg_path, layer="cb_2025_us_state_5m")
print(gdf.head())

# Make sure it uses longitude and latitude
gdf = gdf.to_crs("EPSG:4326")

output_path = project_root / "data" / "us_state_data.geojson"

gdf.to_file(output_path, driver="GeoJSON")

print(f"Saved to: {output_path}")