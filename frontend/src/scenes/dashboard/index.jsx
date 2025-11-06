// Dashboard.js
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../../theme";

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
    ],
  },
];

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // جلوگیری از اسکرول پس‌زمینه وقتی overlay باز است
  useEffect(() => {
    if (selectedMaterial) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [selectedMaterial]);

  return (
    <Box
      display="flex"
      height="100vh"
      p={1}
      sx={{
        "& *": { borderRadius: "12px" },
        bgcolor: "rgba(22, 22, 24, 0.7)",
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
        width="80%"
        height="90vh"
      >
        {/* حالت عادی - دو complex */}
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
                      onClick={() => setSelectedMaterial({ ...m, parent: complex })}
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

        {/* حالت نمایش جزئیات Material */}
        {selectedMaterial && (
          <Box
            position="absolute"
            inset={0}
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              bgcolor: "rgba(10, 10, 10, 0.92)",
              zIndex: 999,
              transition: "opacity 0.3s ease",
            }}
          >
            <Box
              width="80%"
              maxWidth={800}
              bgcolor="rgba(255,255,255,0.05)"
              p={6}
              position="relative"
              textAlign="center"
              boxShadow="0 10px 40px rgba(0,0,0,0.6)"
            >
              {/* دکمه بستن */}
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

              <Button
                variant="contained"
                color="primary"
                onClick={() => alert(`Action for ${selectedMaterial.name}`)}
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
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
