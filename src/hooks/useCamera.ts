import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        video.oncanplay = () => setReady(true);
      })
      .catch(() => setError("카메라 접근이 거부되었습니다."));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, ready, error };
}
