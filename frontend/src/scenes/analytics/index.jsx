import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
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
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/analytic", {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch analytic data");
        const data = await res.json();
        console.log("Analytic API data:", data); // <--- بررسی داده‌ها
        setAnalyticData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching analytic data:", err);
        setAnalyticData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytic();
  }, []);

  const makeChartData = (data, yField, label) => {
    if (!Array.isArray(data)) return [];

    const seriesData = data
      .filter((d) => d[yField] != null && d["Date"]) // فقط رکوردهایی که yField و Date دارند
      .map((d) => {
        // تبدیل string تاریخ به Date
        const xValue = new Date(d["Date"] + "T00:00:00"); // اضافه کردن T00:00:00 برای جلوگیری از timezone issues
        return { x: xValue, y: parseFloat(d[yField]) || 0 };
      })
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
        {loading ? (
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

  return (
    <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gridTemplateRows="1fr" gap={2} height="90vh" sx={{ bgcolor: "rgba(22,22,24,0.7)", p: 1 }}>
      <Box bgcolor="rgba(255,255,255,0.05)" sx={{ borderRadius: 2, p: 1 }}>
        <ChartBox title="Energy Intensity" yField="Energy Intensity Methanol" yLegend="Energy Intensity" />
      </Box>
      <Box bgcolor="rgba(255,255,255,0.05)" sx={{ borderRadius: 2, p: 1 }}>
        <ChartBox title="Theoretical Prod Ton" yField="Theoretical Prod Ton Methanol" yLegend="Ton" />
      </Box>
    </Box>
  );
};

export default Analytics;
