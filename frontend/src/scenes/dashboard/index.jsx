// Dashboard.js
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../../theme";
import keycloak from "../../keycloak"


const initialData = [
  {
    id: "c1",
    name: "Complex 1",
    materials: [
      { id: "m1", name: "Material 1", details: "Details about Material 1" },
      { id: "m2", name: "Material 2", details: "Details about Material 2" },
    ],
  },
  {
    id: "c2",
    name: "Complex 2",
    materials: [
      { id: "m3", name: "Material 3", details: "Details about Material 3" },
      { id: "m4", name: "Material 4", details: "Details about Material 4" },
    ],
  },
];

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // جلوگیری از اسکرول پس‌زمینه هنگام باز بودن جزئیات
  useEffect(() => {
    document.body.style.overflow = selectedMaterial ? "hidden" : "auto";
  }, [selectedMaterial]);

  // تابع برای گرفتن داده از API
  const handleMaterialClick = async (material, complex) => {
    setSelectedMaterial({ ...material, parent: complex });
    setChartData(null);
    setLoading(true);

try {
  const response = await fetch(
    `http://localhost:5000/api/data?complex=${complex.id}&material=${material.id}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${keycloak.token}`, 
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

    // داده باید این شکل باشه:
    // [ { label: "Jan", value: 30 }, { label: "Feb", value: 50 } ]
    setChartData(data);
  } catch (error) {
    console.error("Error fetching chart data:", error);
  } finally {
    setLoading(false);
  }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      p={1}
      sx={{
        "& *": { borderRadius: "12px" },
        bgcolor: "rgba(22, 22, 24, 0.9)",
      }}
      justifyContent="center"
      alignItems="center"
    >
      {/* Container for the two complexes */}
      <Box
        position="relative"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={3}
        width="85%"
        height="90vh"
      >
        {/* complex in showing detail */}
        {!selectedMaterial && (
          <>
            {initialData.map((complex) => (
              <Box
                key={complex.id}
                flex={1}
                p={8}
                bgcolor="rgba(255, 255, 255, 0.05)"
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={3}
              >
                <Typography variant="h3" color="white">
                  {complex.name}
                </Typography>

                {/* Materials */}
                <Box display="flex" gap={2}>
                  {complex.materials.map((m) => (
                    <Box
                      key={m.id}
                      bgcolor="rgba(255,255,255,0.1)"
                      p={2}
                      minWidth={100}
                      textAlign="center"
                      sx={{
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "scale(1.1)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        },
                      }}
                      onClick={() => handleMaterialClick(m, complex)}
                    >
                      <Typography variant="h6" color="white">
                        {m.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </>
        )}

        {/* material in showing detail */}
        {selectedMaterial && (
          <Box
            position="absolute"
            inset={0}
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              bgcolor: "rgba(10, 10, 10, 0.95)",
              zIndex: 999,
              transition: "opacity 0.3s ease",
            }}
          >
            <Box
              width="80%"
              maxWidth={900}
              bgcolor="rgba(255,255,255,0.05)"
              p={6}
              position="relative"
              textAlign="center"
              boxShadow="0 10px 40px rgba(0,0,0,0.6)"
            >
              {/* close button*/}
              <IconButton
                onClick={() => setSelectedMaterial(null)}
                sx={{ position: "absolute", top: 16, right: 16, color: "white" }}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h3" color="white" mb={2}>
                {selectedMaterial.name}
              </Typography>

              <Typography variant="subtitle1" color="white" mb={3}>
                Parent: {selectedMaterial.parent.name}
              </Typography>

              <Typography color="white" mb={4}>
                {selectedMaterial.details}
              </Typography>

              {/* show chart*/}
              {loading && (
                <Typography color="gray" mt={3}>
                  Loading chart data...
                </Typography>
              )}

              {!loading && chartData && (
                <Box height="350px" mt={4}>
                  <ResponsiveBar
                    data={chartData}
                    keys={["value"]}
                    indexBy="label"
                    margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
                    padding={0.3}
                    colors={{ scheme: "nivo" }}
                    axisBottom={{
                      tickRotation: -30,
                      legend: "Category",
                      legendPosition: "middle",
                      legendOffset: 40,
                    }}
                    axisLeft={{
                      legend: "Value",
                      legendPosition: "middle",
                      legendOffset: -50,
                    }}
                    theme={{
                      textColor: "white",
                      axis: { ticks: { text: { fill: "white" } } },
                      legends: { text: { fill: "white" } },
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor="white"
                  />
                </Box>
              )}

              {!loading && !chartData && (
                <Typography color="gray" mt={3}>
                  No data available.
                </Typography>
              )}

              {/* دکمه‌ها */}
              <Box mt={5}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    alert(`Action for ${selectedMaterial.name}`)
                  }
                >
                  Do Something
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.4)",
                    ml: 2,
                  }}
                  onClick={() => setSelectedMaterial(null)}
                >
                  Back
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
