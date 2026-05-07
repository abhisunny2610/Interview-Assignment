import { useState } from "react";
import OuterCarousel from "./OuterCarousel.jsx";
import InnerCarousel from "./InnerCarousel.jsx";
import React from "react";


export default function Carousel({ videos, actions }) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const handleOpen = (index) => {
    setStartIndex(index);
    setOpen(true);
  };

  return (
    <>
      <OuterCarousel videos={videos} onClick={handleOpen} />
      {open && (
  <div className="modal">
    <button
      className="close-modal-btn"
      onClick={() => setOpen(false)}
    >
      ✕
    </button>

    <InnerCarousel
      videos={videos}
      startIndex={startIndex}
      actions={actions}
    />
  </div>
)}
    </>
  );
}