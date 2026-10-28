import { Close, RemoveRedEye } from "@mui/icons-material";
import { Box, ButtonBase, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";

interface Props {
  track: ShazamTrack;
  onDismiss: () => void;
  onOpen: () => void;
}

/**
 * The result that lands under the listen button. One row: artwork, title over
 * artist, two icon actions. Tapping the title or the eye opens the full track.
 */
export default function InlineResultCard({ track, onDismiss, onOpen }: Props) {
  return (
    <Box sx={{ marginY: 2, width: "100%" }} data-testid="inline-result-card">
      <Card sx={{ display: "flex", alignItems: "center", padding: "0.5rem" }}>
        <CardMedia sx={{ lineHeight: 0, flex: "0 0 auto", borderRadius: "12px", overflow: "hidden" }}>
          <ButtonBase onClick={onOpen} aria-label={`Open ${track.title}`}>
            <ImageWithFallback height="60" width="60" alt="" src={track?.images?.coverart || ""} />
          </ButtonBase>
        </CardMedia>

        <CardContent sx={{ padding: "0.25rem 0.75rem", flex: "1 1 0", minWidth: 0 }}>
          <ButtonBase
            sx={{ textAlign: "left", width: "100%", justifyContent: "flex-start", borderRadius: "8px" }}
            onClick={onOpen}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.25 }}
                noWrap
              >
                {track.title}
              </Typography>
              {track.subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.9rem", lineHeight: 1.3 }}
                  noWrap
                >
                  {track.subtitle}
                </Typography>
              )}
            </Box>
          </ButtonBase>
        </CardContent>

        <CardActions sx={{ padding: 0, gap: "2px" }}>
          <ButtonBase
            onClick={onOpen}
            aria-label="View result"
            sx={{ width: 44, height: 44, borderRadius: "50%" }}
          >
            <RemoveRedEye />
          </ButtonBase>
          <ButtonBase
            onClick={onDismiss}
            aria-label="Dismiss result"
            sx={{ width: 44, height: 44, borderRadius: "50%" }}
          >
            <Close />
          </ButtonBase>
        </CardActions>
      </Card>
    </Box>
  );
}
