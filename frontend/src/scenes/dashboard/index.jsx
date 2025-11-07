// Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ResponsiveLine } from "@nivo/line";
import keycloak from "../../keycloak";

const initialData = [
  {
    id: 1,
    name: "Azon",
    materials: [
      { id: 3, name: "Methanol" },
      { id: 6, name: "Ammonia" },
    ],
  },
  {
    id: 2,
    name: "Methara",
    materials: [{ id: 3, name: "Methanol" }],
  },
];

const COLOR_PALETTE = [
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#76B7B2",
  "#59A14F",
  "#EDC948",
  "#B07AA1",
  "#FF9DA7",
  "#9C755F",
  "#BAB0AC",
  "#2E8B57",
  "#D94F70",
  "#4C72B0",
  "#DD8452",
  "#55A868",
  "#8172B2",
  "#DA8BC3",
  "#8C8C8C",
];

const Dashboard = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [allData, setAllData] = useState([]); // measurement endpoint data (feed/fuel/product)
  const [sensorData, setSensorData] = useState([]); // sensor endpoint data (temperature/pressure)
  const [loading, setLoading] = useState(false);
  const [loadingSensor, setLoadingSensor] = useState(false);

  // Feed filter menu
  const [anchorElFeed, setAnchorElFeed] = useState(null);
  const [selectedFilterFeed, setSelectedFilterFeed] = useState("All");

  // Fuel filter menu
  const [anchorElFuel, setAnchorElFuel] = useState(null);
  const [selectedFilterFuel, setSelectedFilterFuel] = useState("All");

  // COLOR MAP (stable colors) - reset per material selection
  const colorMapRef = useRef({});
  const colorIndexRef = useRef(0);

  const resetColorMap = () => {
    colorMapRef.current = {};
    colorIndexRef.current = 0;
  };

  const getColorForKey = (key) => {
    if (!key) return COLOR_PALETTE[0];
    const map = colorMapRef.current;
    if (map[key]) return map[key];
    const color = COLOR_PALETTE[colorIndexRef.current % COLOR_PALETTE.length];
    map[key] = color;
    colorIndexRef.current += 1;
    return color;
  };

  // fetch measurement + sensor when selection changes
  useEffect(() => {
    if (!selectedMaterial) return;

    resetColorMap(); // reset colors for new material

    const fetchMeasurement = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/measurement?complex=${selectedMaterial.parent.id}&material=${selectedMaterial.id}`,
          { headers: { Authorization: `Bearer ${keycloak.token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch measurement data");
        const data = await res.json();
        setAllData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching measurement data:", err);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchSensor = async () => {
      setLoadingSensor(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/sensor?complex=${selectedMaterial.parent.id}`,
          { headers: { Authorization: `Bearer ${keycloak.token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch sensor data");
        const data = await res.json();
        setSensorData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching sensor data:", err);
        setSensorData([]);
      } finally {
        setLoadingSensor(false);
      }
    };

    fetchMeasurement();
    fetchSensor();
  }, [selectedMaterial]);

  // ----------------------------
  // Chart data builders
  // ----------------------------

  // Feed Consumption
  const makeFeedConsumptionChartData = (data) => {
    const grouped = {};
    data.forEach((d) => {
      if (!d.parameter_name) return;
      if (!["feed_consumed", "product_output"].includes(d.parameter_name)) return;

      const materialName = d.feed_material_name || d.product_material_name || "Unknown";
      const line = d.line_number ? `L${d.line_number}` : "";
      const typeLabel = d.parameter_name === "feed_consumed" ? "Feed" : "Production";
      const key = `${typeLabel}: ${materialName}${line ? ` (${line})` : ""}`;

      if (selectedFilterFeed === "Feed" && typeLabel !== "Feed") return;
      if (selectedFilterFeed === "Production" && typeLabel !== "Production") return;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        x: new Date(d.measurement_date),
        y: d.measured_value != null ? d.measured_value : 0,
      });
    });

    return Object.entries(grouped)
      .map(([id, arr]) => ({ id, data: arr.sort((a, b) => a.x - b.x), color: getColorForKey(id) }))
      .filter((s) => s.data.length > 0);
  };

  // Fuel Consumption
  const makeFuelConsumptionChartData = (data) => {
    const grouped = {};
    data.forEach((d) => {
      if (!d.parameter_name) return;
      if (d.parameter_name !== "product_output") return;

      const feedName = d.feed_material_name || "";
      const productName = d.product_material_name || "Unknown";
      const line = d.line_number ? `L${d.line_number}` : "";
      const key = `Fuel: ${productName}${feedName ? ` / ${feedName}` : ""}${line ? ` (${line})` : ""}`;

      if (selectedFilterFuel === "Fuel" && !d.feed_material_name) return;
      if (selectedFilterFuel === "Production" && d.parameter_name !== "product_output") return;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        x: new Date(d.measurement_date),
        y: d.measured_value != null ? d.measured_value : 0,
      });
    });

    return Object.entries(grouped)
      .map(([id, arr]) => ({ id, data: arr.sort((a, b) => a.x - b.x), color: getColorForKey(id) }))
      .filter((s) => s.data.length > 0);
  };

  // Sensor charts: STRICT filter by parameterName (exact match, case-insensitive)
  const makeSensorChartData = (data, parameterName) => {
    if (!parameterName) return [];

    const target = parameterName.toLowerCase();
    const grouped = {};

    data.forEach((d) => {
      if (!d.parameter_name) return;
      if (String(d.parameter_name).toLowerCase() !== target) return; // <-- strict filter

      const equipment = d.equipment_name || `Sensor ${d.sensor_data_id || ""}`;
      const line = d.line_number ? `L${d.line_number}` : "";
      const key = `${equipment}${line ? ` (${line})` : ""}`;

      if (!grouped[key]) grouped[key] = [];
      // timestamp: expecting ms; if seconds replace with *1000 (user can adjust)
      const ts = typeof d.timestamp === "number" ? new Date(d.timestamp) : new Date(d.timestamp);
      grouped[key].push({ x: ts, y: d.sensor_value != null ? d.sensor_value : 0 });
    });

    return Object.entries(grouped)
      .map(([id, arr]) => ({ id, data: arr.sort((a, b) => a.x - b.x), color: getColorForKey(id) }))
      .filter((s) => s.data.length > 0);
  };

  // ----------------------------
  // Chart components (unchanged styling)
  // ----------------------------

  const FeedConsumptionChartBox = () => {
    const chartData = makeFeedConsumptionChartData(allData);

    const handleMenuOpen = (event) => setAnchorElFeed(event.currentTarget);
    const handleMenuClose = () => setAnchorElFeed(null);
    const handleFilterChange = (filter) => {
      setSelectedFilterFeed(filter);
      handleMenuClose();
    };

    return (
      <Box height="100%" width="100%" display="flex" flexDirection="column">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" color="white" align="center">
            Feed Consumption
          </Typography>
          <Button variant="outlined" size="small" sx={{ color: "white", borderColor: "white" }} onClick={handleMenuOpen}>
            Filter: {selectedFilterFeed}
          </Button>
          <Menu
            anchorEl={anchorElFeed}
            open={Boolean(anchorElFeed)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem onClick={() => handleFilterChange("All")}>All</MenuItem>
            <MenuItem onClick={() => handleFilterChange("Feed")}>Feed Only</MenuItem>
            <MenuItem onClick={() => handleFilterChange("Production")}>Production Only</MenuItem>
          </Menu>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress color="primary" />
          </Box>
        ) : chartData.length === 0 ? (
          <Typography color="gray" align="center" mt={3}>
            No feed or production data
          </Typography>
        ) : (
          <Box flex={1}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 150, bottom: 70, left: 70 }}
              xScale={{ type: "time", format: "native" }}
              xFormat="time:%Y-%m-%d"
              yScale={{ type: "linear", min: 0, max: "auto" }}
              axisBottom={{ format: "%b %d", tickValues: "every 1 day", legend: "Date", legendOffset: 40, legendPosition: "middle" }}
              axisLeft={{ legend: "Amount (kg / units)", legendOffset: -60, legendPosition: "middle" }}
              colors={(series) => series.color}
              pointSize={6}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 130,
                  itemsSpacing: 4,
                  itemWidth: 120,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: "circle",
                  itemTextColor: "#fff",
                },
              ]}
              theme={{
                axis: { ticks: { text: { fill: "#fff", fontSize: 12 } }, legend: { text: { fill: "#fff", fontSize: 14 } } },
                tooltip: { container: { background: "rgba(0,0,0,0.9)", color: "#fff", fontSize: 13, borderRadius: 6, padding: 10 } },
                legends: { text: { fill: "#fff" } },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  const FuelConsumptionChartBox = () => {
    const chartData = makeFuelConsumptionChartData(allData);

    const handleMenuOpen = (event) => setAnchorElFuel(event.currentTarget);
    const handleMenuClose = () => setAnchorElFuel(null);
    const handleFilterChange = (filter) => {
      setSelectedFilterFuel(filter);
      handleMenuClose();
    };

    return (
      <Box height="100%" width="100%" display="flex" flexDirection="column">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" color="white" align="center">
            Fuel Consumption
          </Typography>
          <Button variant="outlined" size="small" sx={{ color: "white", borderColor: "white" }} onClick={handleMenuOpen}>
            Filter: {selectedFilterFuel}
          </Button>
          <Menu
            anchorEl={anchorElFuel}
            open={Boolean(anchorElFuel)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem onClick={() => handleFilterChange("All")}>All</MenuItem>
            <MenuItem onClick={() => handleFilterChange("Fuel")}>Fuel Only</MenuItem>
            <MenuItem onClick={() => handleFilterChange("Production")}>Production Only</MenuItem>
          </Menu>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress color="primary" />
          </Box>
        ) : chartData.length === 0 ? (
          <Typography color="gray" align="center" mt={3}>
            No fuel data
          </Typography>
        ) : (
          <Box flex={1}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 150, bottom: 70, left: 70 }}
              xScale={{ type: "time", format: "native" }}
              xFormat="time:%Y-%m-%d"
              yScale={{ type: "linear", min: 0, max: "auto" }}
              axisBottom={{ format: "%b %d", tickValues: "every 1 day", legend: "Date", legendOffset: 40, legendPosition: "middle" }}
              axisLeft={{ legend: "Amount (kg / units)", legendOffset: -60, legendPosition: "middle" }}
              colors={(series) => series.color}
              pointSize={6}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 130,
                  itemsSpacing: 4,
                  itemWidth: 120,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: "circle",
                  itemTextColor: "#fff",
                },
              ]}
              theme={{
                axis: { ticks: { text: { fill: "#fff", fontSize: 12 } }, legend: { text: { fill: "#fff", fontSize: 14 } } },
                tooltip: { container: { background: "rgba(0,0,0,0.9)", color: "#fff", fontSize: 13, borderRadius: 6, padding: 10 } },
                legends: { text: { fill: "#fff" } },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Temperature trends (ONLY temperature) - legends only for this chart's series
  const TemperatureTrendsBox = () => {
    const chartData = makeSensorChartData(sensorData, "temperature");

    return (
      <Box height="100%" width="100%" display="flex" flexDirection="column">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" color="white" align="center">
            Process Temperature Trends
          </Typography>
        </Box>

        {loadingSensor ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress color="primary" />
          </Box>
        ) : chartData.length === 0 ? (
          <Typography color="gray" align="center" mt={3}>
            No temperature sensor data
          </Typography>
        ) : (
          <Box flex={1}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 150, bottom: 70, left: 70 }}
              xScale={{ type: "time", format: "native" }}
              xFormat="time:%Y-%m-%d %H:%M"
              yScale={{ type: "linear", min: "auto", max: "auto" }}
              axisBottom={{ format: "%b %d", tickValues: "every 1 day", legend: "Timestamp", legendOffset: 40, legendPosition: "middle" }}
              axisLeft={{ legend: "Value", legendOffset: -60, legendPosition: "middle" }}
              colors={(series) => series.color}
              pointSize={6}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh
              legends={[
                {
                  data: chartData.map((s) => ({ id: s.id, label: s.id, color: s.color })),
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 130,
                  itemsSpacing: 4,
                  itemWidth: 120,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: "circle",
                  itemTextColor: "#fff",
                },
              ]}
              theme={{
                axis: { ticks: { text: { fill: "#fff", fontSize: 12 } }, legend: { text: { fill: "#fff", fontSize: 14 } } },
                tooltip: { container: { background: "rgba(0,0,0,0.9)", color: "#fff", fontSize: 13, borderRadius: 6, padding: 10 } },
                legends: { text: { fill: "#fff" } },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Pressure trends (ONLY pressure) - legends only for this chart's series
  const PressureTrendsBox = () => {
    const chartData = makeSensorChartData(sensorData, "pressure");

    return (
      <Box height="100%" width="100%" display="flex" flexDirection="column">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" color="white" align="center">
            Process Pressure Trends
          </Typography>
        </Box>

        {loadingSensor ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress color="primary" />
          </Box>
        ) : chartData.length === 0 ? (
          <Typography color="gray" align="center" mt={3}>
            No pressure sensor data
          </Typography>
        ) : (
          <Box flex={1}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 150, bottom: 70, left: 70 }}
              xScale={{ type: "time", format: "native" }}
              xFormat="time:%Y-%m-%d %H:%M"
              yScale={{ type: "linear", min: "auto", max: "auto" }}
              axisBottom={{ format: "%b %d", tickValues: "every 1 day", legend: "Timestamp", legendOffset: 40, legendPosition: "middle" }}
              axisLeft={{ legend: "Value", legendOffset: -60, legendPosition: "middle" }}
              colors={(series) => series.color}
              pointSize={6}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh
              legends={[
                {
                  data: chartData.map((s) => ({ id: s.id, label: s.id, color: s.color })),
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 130,
                  itemsSpacing: 4,
                  itemWidth: 120,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: "circle",
                  itemTextColor: "#fff",
                },
              ]}
              theme={{
                axis: { ticks: { text: { fill: "#fff", fontSize: 12 } }, legend: { text: { fill: "#fff", fontSize: 14 } } },
                tooltip: { container: { background: "rgba(0,0,0,0.9)", color: "#fff", fontSize: 13, borderRadius: 6, padding: 10 } },
                legends: { text: { fill: "#fff" } },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // initial selection screen
  if (!selectedMaterial) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" sx={{ bgcolor: "rgba(22,22,24,0.7)" }}>
        {initialData.map((complex) => (
          <Box key={complex.id} mb={3}>
            <Typography variant="h4" color="white" mb={1}>
              {complex.name}
            </Typography>
            <Box display="flex" gap={2}>
              {complex.materials.map((m) => (
                <Box
                  key={m.id}
                  bgcolor="rgba(255,255,255,0.1)"
                  p={2}
                  minWidth={100}
                  textAlign="center"
                  sx={{ cursor: "pointer", borderRadius: 2, transition: "all 0.2s", "&:hover": { transform: "scale(1.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", bgcolor: "rgba(255,255,255,0.2)" } }}
                  onClick={() => setSelectedMaterial({ ...m, parent: complex })}
                >
                  <Typography variant="body1" color="white">
                    {m.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // dashboard with 5 boxes (index 0..4). box 5 removed per request.
  return (
    <Box display="grid" gridTemplateColumns="repeat(3,1fr)" gridTemplateRows="repeat(2,1fr)" gap={2} height="100vh" sx={{ bgcolor: "rgba(22,22,24,0.7)", p: 1 }}>
      {[...Array(5)].map((_, index) => (
        <Box key={index} bgcolor="rgba(255,255,255,0.05)" display="flex" flexDirection="column" justifyContent="flex-start" alignItems="center" sx={{ borderRadius: 2, position: "relative", p: 1 }}>
          {index === 0 && (
            <>
              <IconButton onClick={() => setSelectedMaterial(null)} sx={{ position: "absolute", top: 8, right: 8, color: "white" }}>
                <CloseIcon />
              </IconButton>
              <Typography variant="h5" color="white" mt={2}>
                {selectedMaterial.name}
              </Typography>
              <Typography color="white" variant="body2">
                Complex: {selectedMaterial.parent.name}
              </Typography>
            </>
          )}
          {index === 1 && <FeedConsumptionChartBox />}
          {index === 2 && <FuelConsumptionChartBox />}
          {index === 3 && <TemperatureTrendsBox />}
          {index === 4 && <PressureTrendsBox />}
        </Box>
      ))}
    </Box>
  );
};

export default Dashboard;