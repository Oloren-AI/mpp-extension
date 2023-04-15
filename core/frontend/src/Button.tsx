import React from "react";

const Button = () => {
  return (
    <div
      style={{
        width: "150px",
        height: "150px",
        background: "black",
        margin: "50px",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "10px",
      }}
    >
      Brought to You from a Remote Component
    </div>
  );
};

export default Button;
