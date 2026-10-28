import { useEffect, useMemo, useState } from "react";
import { App } from "@capacitor/app";
import { PauseRounded, PlayArrowRounded } from "@mui/icons-material";
import { Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";

/**
 * Hero for the matched track: artwork first, then the two things people came
 * for (title, artist), then a single action. Everything else lives in the
 * metadata list below, so this card stays quiet.
 */
export default function CardResult({ data }: { data: ShazamTrack }) {
  const [isPlaying, setIsPlaying] = useState<boolean>();

  const sampleURI = useMemo(
    () => data?.hub?.actions?.filter((action) => !!action.uri)?.[0]?.uri,
    [data],
  );

  const sample = useMemo(() => (sampleURI ? new Audio(sampleURI) : undefined), [sampleURI]);

  function togglePlayPause() {
    if (!sample) return;

    if (!isPlaying) {
      sample.play();
      setIsPlaying(true);
    } else {
      sample.pause();
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    if (!sample) return;

    function pausePlayer() {
      sample?.pause();
      sample?.remove();
      setIsPlaying(false);
    }

    App.addListener("pause", () => pausePlayer());
    App.addListener("backButton", () => pausePlayer());

    return () => {
      pausePlayer();
    };
  }, [sample]);

  return (
    <Card sx={{ maxWidth: 340, margin: "0 auto" }}>
      <CardMedia sx={{ aspectRatio: "1 / 1", lineHeight: 0 }}>
        <ImageWithFallback width="400" alt={`${data.title} cover`} src={data.images.coverart} />
      </CardMedia>

      <CardContent sx={{ padding: "1rem 1rem 0.5rem" }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{ fontSize: "1.25rem", lineHeight: 1.2, marginBottom: "0.15rem" }}
        >
          {data.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
          {data.subtitle}
        </Typography>
      </CardContent>

      {sample && (
        <Box sx={{ display: "flex", justifyContent: "center", padding: "0.25rem 1rem 1rem" }}>
          <Button
            variant={isPlaying ? "outlined" : "contained"}
            disableElevation
            startIcon={
              isPlaying ? (
                <PauseRounded sx={{ height: 20, width: 20 }} />
              ) : (
                <PlayArrowRounded sx={{ height: 20, width: 20 }} />
              )
            }
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            onClick={togglePlayPause}
            sx={{ paddingX: 3 }}
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </Box>
      )}
    </Card>
  );
}
