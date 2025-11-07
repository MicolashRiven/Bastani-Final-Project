import { Box, Button, Typography, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { tokens } from "../../theme";

const TopNavigation = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();


  const currentPath = location.pathname;


  const tabs = [
    { title: "Real Time Data", to : "/"},
    { title: "Analytics", to: "/analytics" },
    { title: "Alert", to: "/alert" },
    // { title: "Charts", to: "/charts" },
  ];

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      gap={0.5}
      bgcolor="rgba(22, 22, 24, 0.7)"
      borderRadius="999px"
      p="0px"
      sx={{
        boxShadow: `0 3px 10px ${
          theme.palette.mode === "dark" ? "#00000033" : "#00000022"
        }`,
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.title}
          component={Link}
          to={tab.to}
          sx={{
            textTransform: "capitalize",
            borderRadius: "999px",
            px: 3,
            py: 1,
            color:
              currentPath === tab.to
                ? colors.grey[900]
                : colors.grey[100],
            backgroundColor:
              currentPath === tab.to
                ? colors.grey[100]
                : "transparent",
            "&:hover": {
              backgroundColor:
                currentPath === tab.to
                  ? colors.blueAccent[400]
                  : colors.primary[200],
            },
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="h6">{tab.title}</Typography>
        </Button>
      ))}
    </Box>
  );
};

export default TopNavigation;
