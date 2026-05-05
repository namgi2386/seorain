import "./App.css";
import { useCamera } from "./hooks/useCamera";
import RainCanvas from "./components/RainCanvas";

function App() {
  const { videoRef, ready, error } = useCamera();

  return (
    <>
      <div className="container">
        <video ref={videoRef} autoPlay playsInline muted className="video" />
        {ready && <RainCanvas videoRef={videoRef} />}
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}

export default App;
