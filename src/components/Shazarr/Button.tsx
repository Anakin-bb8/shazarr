import styled from "@emotion/styled";
import { MoreHorizOutlined } from "@mui/icons-material";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Box, IconButton } from "@mui/material";

import { RECORD_DURATION } from "../../constant";
import skullImage from "../../resources/skull.png?inline";
import NotesAnimate from "../NotesAnimate/NotesAnimate";

import { useShazarrProvider } from "./useShazarr";

export default function ShazarrButton() {
  const {
    shazarrLoading,
    recordingStatus,
    actions: { startRecording, resetSearch },
  } = useShazarrProvider();

  const isActive = recordingStatus !== "inactive" || shazarrLoading;

  return (
    <Box sx={{ position: "relative" }}>
      {isActive ? (
        <NotesAnimate duration={recordingStatus === "recording" ? RECORD_DURATION : 0} />
      ) : null}

      <ListenButton>
        <IconButton
          data-testid="record-button"
          aria-label={
            recordingStatus === "inactive" ? "Recognize a song" : "Recognition in progress"
          }
          aria-pressed={recordingStatus === "recording"}
          onClick={() => {
            resetSearch();
            if (recordingStatus === "inactive") {
              startRecording();
            }
          }}
        >
          <Round isAnimate={recordingStatus === "recording" || shazarrLoading}>
            {recordingStatus === "searching" ? (
              <MoreHorizOutlined className="sz-hero-glyph" />
            ) : recordingStatus === "recording" ? (
              <GraphicEqIcon className="sz-hero-glyph" />
            ) : (
              <img src={skullImage} alt="" height="42" width="42" className="sz-hero-glyph-img" />
            )}
          </Round>
        </IconButton>
      </ListenButton>
    </Box>
  );
}

const ListenButton = styled.div`
  position: relative;
  z-index: 10;
`;

/* The signature element: a glass disc over the brand aurora, with an accent
   ring that breathes while listening. Everything else on the screen is quiet. */
const Round = styled.div<{ isAnimate: boolean }>`
  align-items: center;
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.06)
  );
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid var(--sz-glass-stroke);
  box-shadow: var(--sz-glass-shadow), inset 0 1px 0 var(--sz-glass-highlight);
  border-radius: 100%;
  display: flex;
  justify-content: center;
  line-height: 0;
  position: relative;
  height: 9rem;
  width: 9rem;

  .sz-hero-glyph {
    font-size: 3.2rem;
    fill: var(--sz-content);
    opacity: 0.92;
  }

  .sz-hero-glyph-img {
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
  }

  &:before {
    background: radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--sz-accent) 60%, transparent) 0%,
      transparent 70%
    );
    border-radius: 100%;
    content: "";
    position: absolute;
    inset: -14px;
    z-index: -1;
    animation: ${({ isAnimate }) => (isAnimate ? "hero-breathe 2.2s ease-in-out infinite" : "none")};
  }

  @keyframes hero-breathe {
    0% {
      transform: scale(0.96);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.08);
      opacity: 1;
    }
    100% {
      transform: scale(0.96);
      opacity: 0.7;
    }
  }
`;
