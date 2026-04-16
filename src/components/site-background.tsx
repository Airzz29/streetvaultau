"use client";

import { useEffect, useRef, useState } from "react";

export function SiteBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [allowVideo, setAllowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection as
      | { saveData?: boolean; effectiveType?: string }
      | undefined;
    const shouldReduceData =
      Boolean(connection?.saveData) || connection?.effectiveType === "2g";
    setAllowVideo(!prefersReducedMotion && !shouldReduceData);
  }, []);

  useEffect(() => {
    if (!allowVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const attemptPlayback = async () => {
      try {
        await video.play();
      } catch {
        setVideoFailed(true);
      }
    };

    attemptPlayback();
  }, [allowVideo]);

  const showVideo = allowVideo && !videoFailed;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" data-bg-layer="video">
        {showVideo ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            onError={() => {
              setVideoFailed(true);
            }}
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-[linear-gradient(135deg,#4c1d95_0%,#0f172a_55%,#111827_100%)]"
            data-bg-fallback="video-failed"
          />
        )}
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-black/16"
        data-bg-layer="overlay"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.08),transparent_42%),radial-gradient(circle_at_80%_90%,rgba(56,189,248,0.03),transparent_35%)]"
      />
    </>
  );
}
