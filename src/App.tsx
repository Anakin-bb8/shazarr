import { useEffect, useState } from "react";
import { Device } from "@capacitor/device";
import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import { Box, Container, CssBaseline, Stack, Typography } from "@mui/material";

import { AlertHandler } from "./components/Common/Alert/AlertHandler";
import { Analytics } from "./components/Common/Analytics";
import BottomActions from "./components/Common/BottomActions";
import { ConfigProvider } from "./components/Config/Provider";
import { HistoryProvider } from "./components/History/Provider";
import ShazarrButton from "./components/Shazarr/Button";
import { ShazarrProvider } from "./components/Shazarr/Provider";
import ShazarrResults from "./components/Shazarr/Result";
import StatusChip from "./components/Shazarr/ui/StatusChip";
import { buildTheme } from "./styles/theme";

function useSystemMode() {
  const [mode, setMode] = useState<"dark" | "light">(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark",
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const listener = (event: MediaQueryListEvent) => setMode(event.matches ? "light" : "dark");
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return mode;
}

function App() {
  const [devideOS, setDevideOS] = useState<"ios" | "android" | "web">();
  const mode = useSystemMode();
  const theme = buildTheme(mode);

  useEffect(() => {
    Device.getInfo().then(({ platform }) => setDevideOS(platform));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ConfigProvider>
        <HistoryProvider>
          <ShazarrProvider>
            <CssBaseline />
            <Analytics />
            <div className="sz-app-bg" aria-hidden="true" />
            <Main>
              <Container maxWidth="sm">
                <StackStyled direction="column" os={devideOS}>
                  <Box>
                    <H1>Shazarr</H1>
                    <Typography component="h2" variant="h2" color="text.secondary">
                      Offroad Shazam app
                    </Typography>
                    <StatusRow>
                      <StatusChip />
                    </StatusRow>
                  </Box>
                  <ListenArea>
                    <ShazarrButton />
                  </ListenArea>
                  <AlertHandler />
                </StackStyled>
              </Container>
              <ShazarrResults />
              <BottomActions />
            </Main>
          </ShazarrProvider>
        </HistoryProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;

const H1 = styled.h1`
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1;
`;

const Main = styled.main`
  display: flex;
  margin: 0;
  text-align: center;
  min-height: 100dvh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.9rem;
`;

const ListenArea = styled(Box)`
  margin-top: 2.5rem;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StackStyled = styled(Stack)<{
  os: "ios" | "android" | "web" | undefined;
}>`
  min-height: 100dvh;
  padding: ${({ os }) => (os === "ios" ? "1.5rem 0 5rem" : "1.5rem 0 5rem")};
`;
