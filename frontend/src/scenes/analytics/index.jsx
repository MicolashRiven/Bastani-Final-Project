import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { DataGrid } from "@mui/x-data-grid";
import keycloak from "../../keycloak";

const COLOR_PALETTE = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2",
  "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7",
  "#9C755F", "#BAB0AC", "#2E8B57", "#D94F70",
  "#4C72B0", "#DD8452", "#55A868", "#8172B2",
  "#DA8BC3", "#8C8C8C",
];

const Analytics = () => {
  const [analyticData, setAnalyticData] = useState([]);
  const [loadingAnalytic, setLoadingAnalytic] = useState(false);
  const [showAlertTable, setShowAlertTable] = useState(false);

  const colorMapRef = useRef({});
  const colorIndexRef = useRef(0);
  const getColorForKey = (key) => {
    if (!key) return COLOR_PALETTE[0];
    if (colorMapRef.current[key]) return colorMapRef.current[key];
    const color = COLOR_PALETTE[colorIndexRef.current % COLOR_PALETTE.length];
    colorMapRef.current[key] = color;
    colorIndexRef.current += 1;
    return color;
  };

  useEffect(() => {
    const fetchAnalytic = async () => {
      setLoadingAnalytic(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/alert", {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch analytic data");
        const data = await res.json();
        const dataWithId = Array.isArray(data)
          ? data.map((item, index) => ({ id: index, ...item }))
          : [];
        setAnalyticData(dataWithId);
      } catch (err) {
        console.error(err);
        setAnalyticData([]);
      } finally {
        setLoadingAnalytic(false);
      }
    };
    fetchAnalytic();
  }, []);

  const makeChartData = (data, yField, label) => {
    if (!Array.isArray(data)) return [];
    const seriesData = data
      .filter((d) => d[yField] != null && d["date"])
      .map((d) => ({ x: new Date(d["date"] + "T00:00:00"), y: parseFloat(d[yField]) || 0 }))
      .sort((a, b) => a.x - b.x);
    if (!seriesData.length) return [];
    return [{ id: label, data: seriesData, color: getColorForKey(label) }];
  };

  const ChartBox = ({ title, yField, yLegend }) => {
    const chartData = makeChartData(analyticData, yField, title);
    return (
      <Box height="100%" width="100%" display="flex" flexDirection="column">
        <Typography variant="h4" color="white" align="center" mb={1}>
          {title}
        </Typography>
        {loadingAnalytic ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress color="primary" />
          </Box>
        ) : chartData.length === 0 ? (
          <Typography color="gray" align="center" mt={3}>
            No data
          </Typography>
        ) : (
          <Box flex={1}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 50, right: 150, bottom: 70, left: 70 }}
              xScale={{ type: "time", format: "native" }}
              xFormat="time:%Y-%m-%d"
              yScale={{ type: "linear", min: 0, max: "auto" }}
              axisBottom={{
                format: "%b %d",
                tickValues: "every 1 day",
                legend: "Date",
                legendOffset: 40,
                legendPosition: "middle",
              }}
              axisLeft={{ legend: yLegend, legendOffset: -60, legendPosition: "middle" }}
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

  const columns = analyticData.length
    ? Object.keys(analyticData[0]).filter(k => k !== "id").map((key) => ({
        field: key,
        headerName: key.replace(/_/g, " ").toUpperCase(),
        flex: 1,
        minWidth: 120,
      }))
    : [];

  return (
    <Box height="90vh" display="flex" flexDirection="column" gap={1} sx={{ bgcolor: "rgba(22,22,24,0.7)", p: 1 }}>
      <Button variant="contained" color="primary" onClick={() => setShowAlertTable((prev) => !prev)} sx={{ alignSelf: "flex-start" }}>
        {showAlertTable ? "Hide Table" : "Show Table"}
      </Button>

      {showAlertTable ? (
        <Box flex={1} sx={{ overflowY: "auto" }}>
          {loadingAnalytic ? (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <DataGrid
              rows={analyticData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              autoHeight={false}
              disableExtendRowFullWidth={true}
              sx={{
                minHeight: "100%", // جدول خودش scroll بگیره
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: 2,
                ".MuiDataGrid-cell": { color: "#fff" },
                ".MuiDataGrid-columnHeaders": { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" },
                ".MuiDataGrid-footerContainer": { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" },
                ".MuiDataGrid-row:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            />
          )}
        </Box>
      ) : (
        <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gridTemplateRows="1fr" gap={2} flex={1}>
          <Box bgcolor="rgba(255,255,255,0.05)" sx={{ borderRadius: 2, p: 1 }}>
            <ChartBox title="Energy Intensity" yField="Energy Intensity Methanol" yLegend="Energy Intensity" />
          </Box>
          <Box bgcolor="rgba(255,255,255,0.05)" sx={{ borderRadius: 2, p: 1 }}>
            <ChartBox title="Theoretical Prod Ton" yField="Theoretical Prod Ton Methanol" yLegend="Ton" />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Analytics;
