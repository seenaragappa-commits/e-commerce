import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '../utils/constants';

/** An <img> that falls back to a placeholder when the image URL is missing or broken. */
export default function ProductImage({ src, alt, className = '', ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showPlaceholder = !src || failedSrc === src;

  return (
    <img
      src={showPlaceholder ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={className}
      {...props}
    />
  );
}
