"use client";

import Image from "next/image";

export default function ProductThumb({ src, name }: { src?: string; name: string }) {
  if (!src) {
    return (
      <div className="w-10 h-10 rounded-md bg-thead flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-muted font-medium">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="w-10 h-10 rounded-md object-cover flex-shrink-0"
    />
  );
}
