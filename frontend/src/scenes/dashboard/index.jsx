// Dashboard.js
import React from "react";
import { Box, useTheme } from "@mui/material";
import { tokens } from "../../theme";

// import AllComplex from './AllComplex'

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      display="flex"
      height="90%"  
      gap={1}
      p={1}
      sx={{ "& *": { borderRadius: "12px" }}}
    >
      {/* small box */}
      {/* <Box
        display="flex"
        flexDirection="column"
        gap={1}
        width="20%"
        
      >
        <Box flex={1} bgcolor="rgba(22, 22, 24, 0.7)" p={1}>
          Box 1
        </Box>
        <Box flex={1} bgcolor="rgba(22, 22, 24, 0.7)" p={1}>
          Box 2
        </Box>
        <Box flex={1.2} bgcolor="rgba(22, 22, 24, 0.7)" p={1}>
          Box 3
        </Box>
        <Box flex={1} bgcolor="rgba(22, 22, 24, 0.7)" p={1}>
          Box 4
        </Box>
      </Box> */}

      {/* big box */}
      <Box
        flex={1}
        bgcolor="rgba(22, 22, 24, 0.7)"
        p={0.5}
        display="flex"
        justifyContent="center"
        alignItems="center"
      > 
        {/* <AllComplex></AllComplex> */}
      
      </Box>
    </Box>
  );
};

export default Dashboard;
