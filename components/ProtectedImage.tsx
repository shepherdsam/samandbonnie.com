'use client';

type ProtectedImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function ProtectedImage({ src, alt, className }: ProtectedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
