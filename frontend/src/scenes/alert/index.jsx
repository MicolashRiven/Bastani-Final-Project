import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import keycloak from "../../keycloak";

const Alert = () => {
  const [alertData, setAlertData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    { field: "Date", headerName: "Date", flex: 1, minWidth: 120 },
    { field: "Yield Methanol", headerName: "Yield Methanol", flex: 1, minWidth: 150 },
    { field: "Flag Methanol", headerName: "Flag Methanol", flex: 1.5, minWidth: 200 },
    { field: "Ratio CH4 Methanol", headerName: "Ratio CH4 Methanol", flex: 1, minWidth: 150 },
    { field: "Ratio O2 Methanol", headerName: "Ratio O2 Methanol", flex: 1, minWidth: 150 },
    { field: "Energy Intensity Methanol", headerName: "Energy Intensity Methanol", flex: 1.5, minWidth: 180 },
    { field: "Energy Flag Methanol", headerName: "Energy Flag Methanol", flex: 1.5, minWidth: 180 },
    { field: "Limiting Reagent Methanol", headerName: "Limiting Reagent Methanol", flex: 1.5, minWidth: 180 },
    { field: "Theoretical Prod Ton Methanol", headerName: "Theoretical Prod Ton Methanol", flex: 1.5, minWidth: 180 },
    { field: "Reagent Deviation Methanol", headerName: "Reagent Deviation Methanol", flex: 1, minWidth: 150 },
    { field: "Reagent Deviation Ratio Methanol", headerName: "Reagent Deviation Ratio Methanol", flex: 1.5, minWidth: 180 },
    { field: "Efficiency Methanol", headerName: "Efficiency Methanol", flex: 1, minWidth: 150 },
    { field: "Reagent Flag Methanol", headerName: "Reagent Flag Methanol", flex: 1.5, minWidth: 180 },
  ];

  useEffect(() => {
    const fetchAlertData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/alert", {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch alert data");
        const data = await res.json();
        const dataWithId = Array.isArray(data)
          ? data.map((item, index) => ({ id: index, ...item }))
          : [];
        setAlertData(dataWithId);
      } catch (err) {
        console.error("Error fetching alert data:", err);
        setAlertData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertData();
  }, []);

  return (
    <Box
      height="90vh"
      width="100%"
      sx={{
        bgcolor: "rgba(22,22,24,0.7)",
        p: 2,
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" color="white" mb={2} align="center">
        Alert Data
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <CircularProgress color="primary" />
        </Box>
      ) : alertData.length === 0 ? (
        <Typography color="gray" align="center" mt={3}>
          No data
        </Typography>
      ) : (
        <Box flex={1} sx={{ overflowY: "auto" }}>
          <DataGrid
            rows={alertData}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight={false}
            disableExtendRowFullWidth={true}
            sx={{
              height: "100%",
              bgcolor: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              ".MuiDataGrid-cell": { color: "#fff" },
              ".MuiDataGrid-columnHeaders": { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" },
              ".MuiDataGrid-footerContainer": { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" },
              ".MuiDataGrid-row:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Alert;
