export function FloatingPetals() {
  return (
    <>
      <svg className="floating-petal" style={{ top: "8%", left: "4%", animationDelay: "0s" }} width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M12 2c2 4 6 6 6 10s-4 8-6 10c-2-2-6-6-6-10s4-6 6-10z" fill="hsl(0,80%,88%)"/>
      </svg>
      <svg className="floating-petal" style={{ top: "20%", right: "5%", animationDelay: "2s" }} width="50" height="50" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="6" fill="hsl(200,80%,85%)"/>
        <circle cx="6" cy="8" r="3" fill="hsl(140,50%,85%)"/>
      </svg>
      <svg className="floating-petal" style={{ bottom: "10%", left: "8%", animationDelay: "4s" }} width="70" height="70" viewBox="0 0 24 24" fill="none">
        <path d="M12 4c1 3 5 4 5 8s-4 5-5 8c-1-3-5-4-5-8s4-5 5-8z" fill="hsl(50,80%,85%)"/>
      </svg>
      <svg className="floating-petal" style={{ bottom: "30%", right: "10%", animationDelay: "6s" }} width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10z" fill="hsl(140,50%,85%)"/>
      </svg>
    </>
  );
}
