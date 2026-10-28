import { Close } from "@mui/icons-material";
import { Box, Button, Container, Drawer, useMediaQuery } from "@mui/material";

import HistoryCard from "./Card";
import { useHistoryProvider } from "./useHistory";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryList({ open, onClose }: Props) {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const { history } = useHistoryProvider();

  if (!history || history?.length === 0) return null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <div className="sz-sheet-grabber" aria-hidden="true" />
      <Box
        sx={{ paddingTop: 1, mb: isLandscape ? 2 : 5 }}
        data-testid="history-list"
      >
        <Container maxWidth="xs" sx={{ padding: "0 0.5rem" }}>
          {history?.map((item, index) => (
            <HistoryCard item={item} key={`history-item${index}`} />
          ))}
          <Button
            startIcon={<Close />}
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ marginBottom: 1 }}
          >
            Close records
          </Button>
        </Container>
      </Box>
    </Drawer>
  );
}
