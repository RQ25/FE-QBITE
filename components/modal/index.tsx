"use client";

import { ReactNode } from "react";

const Modal = ({
  children,
  isShow,
  onClose,
}: {
  children: ReactNode;
  isShow: boolean;
  onClose: (status: boolean) => void;
}) => {
  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose(false);
  };

  return (
    <div
      className={`w-full h-dvh z-[1024] bg-black/70 backdrop-blur-md fixed top-0 left-0 ${
        isShow ? "flex" : "hidden"
      } justify-center items-center p-4 transition-all duration-300`}
      onClick={handleClickOutside}
    >
      <div className="w-5/6 md:w-4/6 lg:w-3/6 max-h-[90vh] overflow-y-auto glass-card backdrop-blur-2xl bg-slate-950/90 border border-white/10 text-white rounded-2xl shadow-2xl p-6 relative">
        {children}
      </div>
    </div>
  );
};

export default Modal;