import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/devsync-logo.png";
import "./SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <img src={logo} alt="DevSync" className="splash-logo" />
      </div>
    </div>
  );
}