import { useEffect, useRef } from "react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import type { Raindrop, Particle } from "../rain/rainPhysics";
import {
  createRaindrop,
  createRaindropInitial,
  createSplash,
  updateParticles,
} from "../rain/rainPhysics";

const DROP_COUNT = 1500;
// 성능 우선: 저해상도 마스크로 충돌 감지
const MASK_W = 160;
const MASK_H = 90;

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function RainCanvas({ videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d")!;

    // 마스크 읽기 전용 오프스크린 캔버스
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = MASK_W;
    maskCanvas.height = MASK_H;
    const maskCtx = maskCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    let maskData: Uint8ClampedArray | null = null;
    let drops: Raindrop[] = [];
    let particles: Particle[] = [];
    let frameCount = 0;
    let isSegmenting = false;
    let animId: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 초기 빗방울은 화면 전체에 분산, 이후 리스폰은 상단에서
      drops = Array.from({ length: DROP_COUNT }, (_, i) =>
        i < DROP_COUNT / 2
          ? createRaindropInitial(canvas.width, canvas.height)
          : createRaindrop(canvas.width)
      );
    }

    resize();
    window.addEventListener("resize", resize);

    // container가 scaleX(-1)이므로 video와 canvas 모두 미러됨.
    // canvas x → 마스크 x 매핑 시 플립 불필요 (양쪽 미러가 상쇄됨)
    function isPerson(x: number, y: number): boolean {
      if (!maskData) return false;
      const mx = Math.floor((x / canvas.width) * MASK_W);
      const my = Math.floor((y / canvas.height) * MASK_H);
      if (mx < 0 || mx >= MASK_W || my < 0 || my >= MASK_H) return false;
      const idx = (my * MASK_W + mx) * 4;
      return maskData[idx] > 128;
    }

    const seg = new SelfieSegmentation({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${f}`,
    });

    seg.setOptions({ modelSelection: 0 }); // 0 = general (빠름)

    seg.onResults((results) => {
      maskCtx.clearRect(0, 0, MASK_W, MASK_H);
      maskCtx.drawImage(results.segmentationMask, 0, 0, MASK_W, MASK_H);
      maskData = maskCtx.getImageData(0, 0, MASK_W, MASK_H).data;
    });

    function loop() {
      frameCount++;

      // 3프레임마다 세그멘테이션 갱신 (성능 우선)
      if (frameCount % 3 === 0 && !isSegmenting && video.readyState >= 2) {
        isSegmenting = true;
        seg
          .send({ image: video })
          .then(() => {
            isSegmenting = false;
          })
          .catch(() => {
            isSegmenting = false;
          });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const splashes: Particle[] = [];

      drops = drops.map((drop) => {
        if (isPerson(drop.x, drop.y)) {
          splashes.push(...createSplash(drop.x, drop.y));
          return createRaindrop(canvas.width);
        }
        if (drop.y > canvas.height + 10) {
          return createRaindrop(canvas.width);
        }
        return { ...drop, y: drop.y + drop.speed };
      });

      particles = [...updateParticles(particles), ...splashes];

      // 빗방울 그리기
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (const d of drops) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 튀김 파티클 그리기
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      seg.close();
    };
  }, [videoRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
}
