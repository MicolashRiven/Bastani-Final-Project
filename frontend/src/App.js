import { useState } from "react";
import { Routes , Route } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

import { CssBaseline, ThemeProvider } from "@mui/material"
import { Box } from "@mui/material";

import { ColorModeContext, useMode} from "./theme";
import Topbar from "./scenes/global/Topbar";
import Dashboard from "./scenes/dashboard";

import DarkVeil from "./components/reactbits/DarkVeil/DarkVeil";



function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  const { keycloak, initialized } = useKeycloak();
  
  return (  
    <Box>


    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            position: "fixed",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: -1,
          }}
        >
        {/* background component */}
        <DarkVeil></DarkVeil>
        </Box>
        <div className="app">
          <main className="content">
            
            <Topbar setIsSidebar={setIsSidebar} />

            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </main>
        </div> 
      </ThemeProvider>
    </ColorModeContext.Provider>
    </Box>
  );
}

export default App;
