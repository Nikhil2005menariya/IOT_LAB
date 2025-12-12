// src/components/Loader.jsx
import React from 'react';

export default function Loader({ size = 20 }) {
  return (
    <div style={{ width: size, height: size }} className="inline-block animate-spin border-2 border-t-transparent border-neutralSoft-300 rounded-full"></div>
  );
}
